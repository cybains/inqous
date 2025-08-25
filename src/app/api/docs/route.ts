import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import getMongoClient from "../../../lib/mongo";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_DB || "app");

  const rows = await db
    .collection("documents")
    .find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  const docs = rows.map((r: any) => ({
    _id: r._id.toString(),
    filename: r.filename,
    contentType: r.contentType ?? null,
    size: typeof r.size === "number" ? r.size : null,
    createdAt: r.createdAt,
  }));

  return NextResponse.json({ docs });
}
