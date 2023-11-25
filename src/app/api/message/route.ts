import { db } from "@/db";
import { messageValidator } from "@/lib/validators/messageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  // Endpoint

  const body = await req.json();

  const { getUser } = getKindeServerSession();
  const user = await getUser();

  const userId = user?.id;

  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { fileId, message } = messageValidator.parse(body);

  const file = await db.file.findFirst({
    where: {
      id: fileId,
      userId,
    },
  });

  if (!file) return new Response("Not Found", { status: 404 });

  await db.message.create({
    data: {
      text: message,
      isUserMessage: true,
      userId,
      fileId,
    },
  });
};
