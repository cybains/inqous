import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import getMongoClient from "../../../../lib/mongo";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

// GET: list saved jobs + savedIds (both as strings)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ saved: [], savedIds: [] });

  const client = await getMongoClient();
  const dbName = process.env.MONGODB_JOBS_DB || process.env.MONGODB_DB_NAME || "jobsdb";
  const db = client.db(dbName);
  const savedCol = db.collection("saved_jobs");
  const jobsCol = db.collection("jobs");

  const savedRows = await savedCol.find({ userId: session.user.id }).toArray();
  const idsObj: ObjectId[] = [];
  const idsStr: string[] = [];

  for (const s of savedRows) {
    const v = s.jobId;
    if (typeof v === "string") idsStr.push(v);
    else if (v instanceof ObjectId) idsObj.push(v);
    else if (v && typeof v === "object" && v._id instanceof ObjectId) idsObj.push(v._id);
  }

  const or: any[] = [];
  if (idsObj.length) or.push({ _id: { $in: idsObj } });
  if (idsStr.length) or.push({ _id: { $in: idsStr } });

  const jobs = or.length
    ? await jobsCol.find({ $or: or }).sort({ createdAt: -1, _id: -1 }).toArray()
    : [];

  const saved = jobs.map((j: any) => ({
    id: j._id.toString(),
    title: j.title,
    company: j.company ?? j.company_name ?? "",
    location: j.location ?? j.candidate_required_location ?? null,
    url: j.url ?? null,
    createdAt: j.createdAt ?? j.publication_date ?? new Date(j._id.getTimestamp?.() ?? Date.now()).toISOString(),
    jobType: j.jobType ?? j.job_type ?? null,
    salary: j.salary ?? null,
    description: j.description ?? null,
    companyLogo: j.companyLogo ?? j.company_logo ?? null,
    tags: Array.isArray(j.tags) ? j.tags : [],
  }));

  const savedIds = saved.map((s) => s.id);
  return NextResponse.json({ saved, savedIds });
}

// POST: save a job { jobId: string } using the job's actual _id type
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await req.json().catch(() => ({}));
  if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 });

  const client = await getMongoClient();
  const dbName = process.env.MONGODB_JOBS_DB || process.env.MONGODB_DB_NAME || "jobsdb";
  const db = client.db(dbName);
  const savedCol = db.collection("saved_jobs");
  const jobsCol = db.collection("jobs");

  // Resolve id by trying ObjectId then string
  let jobDoc = null;
  if (ObjectId.isValid(jobId)) {
    jobDoc = await jobsCol.findOne({ _id: new ObjectId(jobId) });
  }
  if (!jobDoc) jobDoc = await jobsCol.findOne({ _id: jobId });
  if (!jobDoc) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const key = jobDoc._id; // keep original type

  await savedCol.createIndex({ userId: 1, jobId: 1 }, { unique: true });
  try {
    await savedCol.insertOne({
      userId: session.user.id,
      jobId: key,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // duplicate -> ignore
  }

  return NextResponse.json({ ok: true });
}
