import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import getMongoClient from "../../../../lib/mongo";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

// GET: list saved jobs with details + list of saved ids
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ saved: [], savedIds: [] });

  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_JOBS_DB || "jobsdb");
  const savedCol = db.collection("saved_jobs");
  const jobsCol = db.collection("jobs");

  await savedCol.createIndexes([
    { key: { userId: 1, jobId: 1 }, name: "uniq_user_job", unique: true },
    { key: { userId: 1, createdAt: -1 }, name: "user_createdAt" },
  ]);

  const savedRows = await savedCol.find({ userId: session.user.id }).toArray();
  const ids = savedRows.map((r: any) => r.jobId).filter(Boolean);

  let saved: any[] = [];
  if (ids.length) {
    const jobs = await jobsCol.find({ _id: { $in: ids.map((x: any) => new ObjectId(x)) } }).toArray();
    const byId = new Map(jobs.map((j: any) => [j._id.toString(), j]));
    saved = savedRows
      .map((s: any) => {
        const j = byId.get(s.jobId.toString());
        if (!j) return null;
        return {
          _id: j._id.toString(),
          title: j.title,
          company: j.company,
          location: j.location ?? null,
          url: j.url ?? null,
          createdAt: j.createdAt,
          savedAt: s.createdAt,
        };
      })
      .filter(Boolean) as any[];
  }

  const savedIds = savedRows.map((r: any) => r.jobId.toString());
  return NextResponse.json({ saved, savedIds });
}

// POST: save a job { jobId }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await req.json().catch(() => ({}));
  if (!jobId || !ObjectId.isValid(jobId)) {
    return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
  }

  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_JOBS_DB || "jobsdb");
  const savedCol = db.collection("saved_jobs");

  await savedCol.createIndex({ userId: 1, jobId: 1 }, { unique: true });

  try {
    await savedCol.insertOne({
      userId: session.user.id,
      jobId: new ObjectId(jobId),
      createdAt: new Date().toISOString(),
    });
  } catch (e: any) {
    // ignore duplicate key
  }

  return NextResponse.json({ ok: true });
}
