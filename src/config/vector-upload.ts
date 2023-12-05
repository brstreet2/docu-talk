import { pinecone } from "@/lib/pinecone/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { embeddings } from "./open-ai-embeddings";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import supabase from "@/lib/supabase/supabase";
import mongodb from "@/lib/mongodb/mongodb";
import { MongoDBAtlasVectorSearch } from "langchain/vectorstores/mongodb_atlas";

export async function pineconeUpload(docs: any) {
  const pineconeIndex = pinecone.index("docutalk");
  await PineconeStore.fromDocuments(docs, embeddings, {
    pineconeIndex,
    // namespace: createdFile.id,
  });
}

export async function supabaseUpload(docs: any) {
  await SupabaseVectorStore.fromDocuments(docs, embeddings, {
    client: supabase,
    tableName: "documents",
    queryName: "match_documents",
  });
}

export async function mongoUpload(docs: any) {
  const collection = mongodb.db("docutalk").collection("pro");

  await MongoDBAtlasVectorSearch.fromDocuments(docs, embeddings, {
    collection,
    indexName: "default",
    textKey: "text",
    embeddingKey: "embedding",
  });

  await mongodb.close();
}
