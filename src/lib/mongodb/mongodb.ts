import { MongoClient } from "mongodb";

const mongodb = new MongoClient(process.env.MONGODB_URI!);

export default mongodb;
