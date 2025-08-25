import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
let client: MongoClient | null = null;

async function getClient() {
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }
  if (client) return client;
  client = new MongoClient(uri);
  await client.connect();
  return client;
}

export async function getJobsCollection() {
  const dbName = process.env.MONGODB_DB_NAME || 'jobsdb';
  const db = (await getClient()).db(dbName);
  return db.collection('jobs');
}

export async function getUserDocumentsCollection() {
  const dbName = process.env.MONGODB_DB_NAME || 'jobsdb';
  const db = (await getClient()).db(dbName);
  return db.collection('user_documents');
}
