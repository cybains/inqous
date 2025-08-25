// src/lib/mongo.ts
import { MongoClient } from "mongodb";

let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient> | undefined;

export default function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in environment");
  }

  if (process.env.NODE_ENV === "development") {
    // @ts-ignore: attach to global to reuse in dev
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      // @ts-ignore
      global._mongoClientPromise = client.connect();
    }
    // @ts-ignore
    return global._mongoClientPromise as Promise<MongoClient>;
  }

  if (!clientPromise) {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  return clientPromise;
}
