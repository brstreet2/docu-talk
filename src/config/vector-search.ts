import { pinecone } from "@/lib/pinecone/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { embeddings } from "./open-ai-embeddings";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import supabase from "@/lib/supabase/supabase";
import mongodb from "@/lib/mongodb/mongodb";
import { MongoDBAtlasVectorSearch } from "langchain/vectorstores/mongodb_atlas";

export async function pineconeSearch(message: string) {
  const pineconeIndex = pinecone.index("docutalk");
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
  });
  const results = await vectorStore.similaritySearch(message, 4);

  return results;
}

export async function supabaseSearch(message: string) {
  const supabaseStore = await SupabaseVectorStore.fromExistingIndex(
    embeddings,
    {
      client: supabase,
      tableName: "documents",
      queryName: "match_documents",
    }
  );
  const results = await supabaseStore.similaritySearch(message, 1);

  return results;
}

export async function mongoSearch(message: string) {
  // MongoDB VectorDB
  const mongoClient = mongodb;
  const collection = mongoClient.db("docutalk").collection("pro");

  const similaritySearch = new MongoDBAtlasVectorSearch(embeddings, {
    collection,
    indexName: "default",
    textKey: "text",
    embeddingKey: "embedding",
  });

  const results = await similaritySearch.maxMarginalRelevanceSearch(message, {
    k: 4,
    fetchK: 20,
  });

  return results;
}
