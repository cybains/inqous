import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import getMongoClient from "../../../../lib/mongo";

export const runtime = "nodejs";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_JOBS_DB || "jobsdb");

  const now = new Date().toISOString();
  const docs = [
    { userId: session.user.id, title: "Senior Backend Engineer", company: "Acme Inc.", location: "Vienna, AT", url: "https://example.com/jobs/1", createdAt: now },
    { userId: session.user.id, title: "Product Manager", company: "Globex", location: "Remote", url: "https://example.com/jobs/2", createdAt: now },
    { userId: session.user.id, title: "Data Analyst", company: "Initech", location: "Lisbon, PT", createdAt: now },
  ];

  await db.collection("jobs").insertMany(docs);
  return NextResponse.json({ ok: true, inserted: docs.length });
}
