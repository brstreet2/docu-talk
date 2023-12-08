import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getMemberStatus } from "@/lib/xendit/xendit";
import { PLANS } from "@/config/plans";
import {
  mongoUpload,
  pineconeUpload,
  qdrantUpload,
  supabaseUpload,
} from "@/config/vector-upload";
import { pdfLoader } from "@/config/file-loader";

const f = createUploadthing();

const middleware = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) throw new Error("Unauthorized");

  const membershipPlan = await getMemberStatus();

  return { membershipPlan, userId: user.id };
};

const onUploadComplete = async ({
  metadata,
  file,
}: {
  metadata: Awaited<ReturnType<typeof middleware>>;
  file: {
    key: string;
    name: string;
    url: string;
  };
}) => {
  const isFileExists = await db.file.findFirst({
    where: {
      key: file.key,
    },
  });

  if (isFileExists) return { message: "File Exists!" };

  const createdFile = await db.file.create({
    data: {
      key: file.key,
      name: file.name,
      userId: metadata.userId,
      url: `https://utfs.io/f/${file.key}`,
      uploadStatus: "PROCESSING",
    },
  });

  try {
    const response = await fetch(`https://utfs.io/f/${file.key}`);
    const blob = await response.blob();

    const pageLevelDocs = await pdfLoader(blob);

    // const pageLevelDocs =
    //   blob.type ===
    //   "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    //     ? await docxLoader(blob)
    //     : blob.type === "application/pdf"
    //     ? await pdfLoader(blob)
    //     : await csvLoader(blob);

    const pagesAmt = pageLevelDocs.length;

    const { membershipPlan } = metadata;
    const { isMember } = membershipPlan;

    const isProExceed =
      pagesAmt > PLANS.find((plan) => plan.name === "Pro")!.pagesPerPdf;
    const isFreeExceed =
      pagesAmt > PLANS.find((plan) => plan.name === "Free")!.pagesPerPdf;

    if ((isMember && isProExceed) || (!isMember && isFreeExceed)) {
      await db.file.update({
        data: {
          uploadStatus: "FAILED",
        },
        where: {
          id: createdFile.id,
        },
      });
    }

    // Vectorize the entire PDF
    // Pinecone VectorDB
    // await pineconeUpload(pageLevelDocs);

    // Supabase VectorDB
    // await supabaseUpload(pageLevelDocs);

    // MongoDB VectorDB
    // await mongoUpload(pageLevelDocs);

    // Qdrant VectorDB
    await qdrantUpload(pageLevelDocs, createdFile.id);

    await db.file.update({
      data: {
        uploadStatus: "SUCCESS",
      },
      where: {
        id: createdFile.id,
      },
    });
  } catch (error) {
    console.log(error);
    await db.file.update({
      data: {
        uploadStatus: "FAILED",
      },
      where: {
        id: createdFile.id,
      },
    });
  }
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  freePlanUploader: f({
    pdf: { maxFileSize: "4MB" },
  })
    // Set permissions and file types for this FileRoute
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  proPlanUploader: f({
    pdf: { maxFileSize: "16MB" },
  })
    // Set permissions and file types for this FileRoute
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
