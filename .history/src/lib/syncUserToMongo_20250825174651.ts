// src/lib/syncUserToMongo.ts
import getMongoClient from "./mongo";
import { prisma } from "./prisma";

/**
 * Mirrors the Prisma user (and their OAuth accounts) into MongoDB.
 * - Upsert by _id = prisma.user.id
 * - Stores basic user fields and a slim accounts array
 */
export async function syncUserToMongo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { accounts: true },
  });
  if (!user) return;

  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB || "app";
  const db = client.db(dbName);
  const users = db.collection("users");

  await users.updateOne(
    { _id: user.id },
    {
      $set: {
        name: user.name ?? null,
        email: user.email ?? null,
        image: user.image ?? null,
        emailVerified: user.emailVerified ?? null,
        accounts: user.accounts.map((a) => ({
          provider: a.provider,
          providerAccountId: a.providerAccountId,
          type: a.type,
          scope: a.scope ?? null,
          expires_at: a.expires_at ?? null,
          token_type: a.token_type ?? null,
        })),
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );
}
