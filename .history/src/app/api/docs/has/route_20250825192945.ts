import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import getMongoClient from "../../../../lib/mongo";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ hasDocs: false });

  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_DB || "app");
  const count = await db.collection("documents").countDocuments({ userId: session.user.id });
  return NextResponse.json({ hasDocs: count > 0 });
}
