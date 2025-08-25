// src/lib/mongodb.ts
import { MongoClient } from "mongodb";
import type { Db } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Missing environment variable MONGODB_URI");
}

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = globalThis as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;

export const getJobsDb = async (): Promise<Db> => {
  const conn = await clientPromise;
  return conn.db("jobsdb");
};

export const getUserDb = async (): Promise<Db> => {
  const conn = await clientPromise;
  return conn.db("user");
};

