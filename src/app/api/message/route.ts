import { db } from "@/db";
import { messageValidator } from "@/lib/validators/messageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest } from "next/server";
import { openai } from "@/lib/openai/openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import {
  mongoSearch,
  pineconeSearch,
  qdrantSearch,
  supabaseSearch,
} from "@/config/vector-search";

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

  // Pinecone VectorDB
  // const results = await pineconeSearch(message);

  // Supabase VectorDB
  // const results = await supabaseSearch(message);

  // MongoDB VectorDB
  // const results = await mongoSearch(message);

  // Qdrant VectorDB
  const results = await qdrantSearch(fileId, message);

  const prevMessages = await db.message.findMany({
    where: {
      fileId,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 6,
  });

  const formattedPrevMessages = prevMessages.map((msg) => ({
    role: msg.isUserMessage ? ("user" as const) : ("assistant" as const),
    content: msg.text,
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0,
    stream: true,
    messages: [
      {
        role: "system",
        content:
          "You are an assistant, and expert in mathematics, science, philosophies and languages, you are to read the given context provided. You have to answer the user questions about the context, you have to read the previous conversation you have with the users if there are any. You are to answer any questions a user might have outside of the context, giving your very best shot to answer.",
      },
      {
        role: "assistant",
        content: `PREVIOUS CONVERSATION:
        ${formattedPrevMessages.map((message) => {
          if (message.role === "user") return `User: ${message.content}\n`;
          return `Assistant: ${message.content}\n`;
        })}
        
        \n----------------\n
        
        CONTEXT (User may refer the context as document or page):
        ${results.map((r) => r.pageContent).join("\n\n")}"`,
      },
      {
        role: "user",
        content: `${message}`,
      },
    ],
  });

  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      await db.message.create({
        data: {
          text: completion,
          isUserMessage: false,
          fileId,
          userId,
        },
      });
    },
  });

  return new StreamingTextResponse(stream);
};
