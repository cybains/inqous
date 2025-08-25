import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import getMongoClient from "@/lib/mongo";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_JOBS_DB || "jobsdb");
  const rows = await db
    .collection("jobs")
    .find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  const jobs = rows.map((r: any) => ({
    _id: r._id.toString(),
    title: r.title,
    company: r.company,
    location: r.location ?? null,
    url: r.url ?? null,
    createdAt: r.createdAt,
  }));

  return NextResponse.json({ jobs });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const title = (body.title ?? "").trim();
  const company = (body.company ?? "").trim();
  const location = (body.location ?? "").trim();
  const url = (body.url ?? "").trim();

  if (!title || !company) {
    return NextResponse.json({ error: "Missing title/company" }, { status: 400 });
  }

  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_JOBS_DB || "jobsdb");
  const doc = {
    userId: session.user.id,
    title,
    company,
    location: location || null,
    url: url || null,
    createdAt: new Date().toISOString(),
  };
  const res = await db.collection("jobs").insertOne(doc);

  return NextResponse.json({ ok: true, id: res.insertedId.toString() });
}
