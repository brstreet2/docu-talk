import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { privateProcedure, publicProcedure, router } from "./trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { z } from "zod";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";
import { absoluteUrl } from "@/lib/utils";
import { utapi } from "@/lib/uploadthing/utapi";
import { qdrant } from "@/lib/qdrant/qdrant";
import { CreateInvoiceRequest, Invoice } from "xendit-node/invoice/models";
import { xenditInvoiceClient } from "@/lib/xendit/xendit";

export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id || !user?.email)
      throw new TRPCError({ code: "UNAUTHORIZED" });

    // Check if user exists in DB
    const dbUser = await db.user.findFirst({
      where: {
        id: user.id,
      },
    });

    if (!dbUser) {
      // Create user to DB
      await db.user.create({
        data: {
          id: user.id,
          email: user.email,
        },
      });
    }
    return { success: true };
  }),
  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;

    return await db.file.findMany({
      where: {
        userId,
      },
    });
  }),
  getFileMessages: privateProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        fileId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { fileId, cursor } = input;
      const limit = input.limit ?? INFINITE_QUERY_LIMIT;

      const file = await db.file.findFirst({
        where: {
          id: fileId,
          userId,
        },
      });

      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      const messages = await db.message.findMany({
        take: limit + 1,
        where: {
          fileId,
        },
        orderBy: {
          createdAt: "desc",
        },
        cursor: cursor ? { id: cursor } : undefined,
        select: {
          id: true,
          isUserMessage: true,
          createdAt: true,
          text: true,
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return {
        messages,
        nextCursor,
      };
    }),
  getFileUploadStatus: privateProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ input, ctx }) => {
      const file = await db.file.findFirst({
        where: {
          id: input.fileId,
          userId: ctx.userId,
        },
      });

      if (!file) return { status: "PENDING" as const };

      return { status: file.uploadStatus };
    }),
  getFile: privateProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;

      const file = await db.file.findFirst({
        where: {
          key: input.key,
          userId,
        },
      });

      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      return file;
    }),
  deleteFile: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const file = await db.file.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });
      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      // Delete file on object storage
      await utapi.deleteFiles(file.key);

      // Delete file on qdrant vector db
      await qdrant.deleteCollection(file.id);

      await db.$transaction([
        db.message.deleteMany({
          where: {
            fileId: file.id,
          },
        }),
        db.file.delete({
          where: {
            id: input.id,
          },
        }),
      ]);

      return file;
    }),
  getMembershipStatus: privateProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;

    const dbUser = await db.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!dbUser) throw new TRPCError({ code: "NOT_FOUND" });

    const isValid = Boolean(
      dbUser.isMember &&
        dbUser.membershipEnd && // 86400000 = 1 day
        dbUser.membershipEnd.getTime() + 86_400_000 > Date.now()
    );

    if (!isValid) {
      const updatedUser = await db.user.update({
        where: {
          id: dbUser.id,
        },
        data: {
          isMember: false,
          membershipType: "free",
          membershipEnd: null,
        },
      });
      let response = {
        isMember: updatedUser.isMember,
        membershipType: updatedUser.membershipType,
        membershipEnd: updatedUser.membershipEnd,
      };
      return response;
    }
    let response = {
      isMember: dbUser.isMember,
      membershipType: dbUser.membershipType,
      membershipEnd: dbUser.membershipEnd,
    };
    return response;
  }),
  createXenditSession: privateProcedure
    .input(z.object({ memberType: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;

      const billingUrl = absoluteUrl("/dashboard/billing");

      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const dbUser = await db.user.findFirst({
        where: {
          id: userId,
        },
      });

      if (!dbUser) throw new TRPCError({ code: "UNAUTHORIZED" });

      const dbTransaction = await db.transaction.findFirst({
        where: {
          userId: userId,
          transactionStatus: "PENDING",
        },
      });

      if (dbTransaction) {
        return {
          status: 200,
          error: false,
          message: `You have an outstanding payment, please pay now!`,
          data: dbTransaction.xenditInvoiceUrl,
        };
      }

      try {
        const dbTransaction = await db.$transaction([
          db.transaction.create({
            data: {
              userId,
              description:
                input.memberType === "pro"
                  ? "Pro Membership Upgrade"
                  : "Premium Membership Upgrade",
              transactionStatus: "PENDING",
              amount: input.memberType === "pro" ? 50000 : 75000,
              expiredDate: new Date(),
            },
          }),
        ]);

        const payload: CreateInvoiceRequest = {
          amount: dbTransaction[0].amount + 4440,
          invoiceDuration: "172800",
          externalId: `${dbTransaction[0].id}`,
          description: dbTransaction[0].description,
          currency: "IDR",
          items: [
            {
              name: `${dbTransaction[0].description}`,
              price: dbTransaction[0].amount,
              quantity: 1,
            },
          ],
          fees: [{ type: "Platform Fee", value: 4440 }],
          successRedirectUrl: absoluteUrl("/dashboard/subscription"),
        };

        const response: Invoice = await xenditInvoiceClient.createInvoice({
          data: payload,
        });

        const dbTransactionUpdate = await db.$transaction([
          db.transaction.update({
            where: {
              id: dbTransaction[0].id,
            },
            data: {
              xenditInvoiceUrl: response.invoiceUrl,
              xenditTransactionId: response.id,
              expiredDate: response.expiryDate,
            },
          }),
        ]);
        return { data: `${dbTransactionUpdate[0].xenditInvoiceUrl}` };
      } catch (e) {
        console.log(e);
      }
    }),
});

export type AppRouter = typeof appRouter;
