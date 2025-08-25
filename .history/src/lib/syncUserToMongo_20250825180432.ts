import getMongoClient from "./mongo";
import { prisma } from "./prisma";

// Shape of the user document we keep in Mongo
interface MongoUser {
  _id: string; // mirror Prisma user.id
  name: string | null;
  email: string | null;
  image: string | null;
  emailVerified: Date | null;
  accounts: Array<{
    provider: string;
    providerAccountId: string;
    type: string;
    scope: string | null;
    expires_at: number | null;
    token_type: string | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export async function syncUserToMongo(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { accounts: true },
  });
  if (!user) return;

  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_DB || "app");
  const users = db.collection<MongoUser>("users");

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
