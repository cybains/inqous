import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import getMongoClient from "../../../lib/mongo";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

const MAX_LIMIT = 50;

function num(v: unknown, d: number) {
  const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
}
function escRx(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function str(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const page = Math.max(1, num(url.searchParams.get("page"), 1));
  const limit = Math.min(MAX_LIMIT, num(url.searchParams.get("limit"), 10));

  const q = str(url.searchParams.get("q"));
  const company = str(url.searchParams.get("company"));
  const location = str(url.searchParams.get("location"));

  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_JOBS_DB || "jobsdb");
  const jobsCol = db.collection("jobs");
  const savedCol = db.collection("saved_jobs");

  // Ensure helpful indexes (safe to call repeatedly)
  await Promise.all([
    jobsCol.createIndexes([
      { key: { userId: 1, createdAt: -1 }, name: "user_createdAt" },
      { key: { userId: 1, title: 1 }, name: "user_title" },
      { key: { userId: 1, company: 1 }, name: "user_company" },
      { key: { userId: 1, location: 1 }, name: "user_location" },
    ]),
    savedCol.createIndex({ userId: 1, jobId: 1 }, { unique: true, name: "uniq_user_job" }),
  ]);

  // Get saved ids for this user so we can EXCLUDE them from the main feed
  const saved = await savedCol.find({ userId: session.user.id }).project({ jobId: 1 }).toArray();
  const savedIds = saved.map((s: any) => s.jobId).filter((x: any) => ObjectId.isValid(x)) as ObjectId[];

  const match: any = { userId: session.user.id };
  if (savedIds.length) match._id = { $nin: savedIds };

  const and: any[] = [];
  if (q) {
    const rx = new RegExp(escRx(q), "i");
    and.push({ $or: [{ title: rx }, { company: rx }, { location: rx }] });
  }
  if (company) and.push({ company: new RegExp(escRx(company), "i") });
  if (location) and.push({ location: new RegExp(escRx(location), "i") });
  if (and.length) match.$and = and;

  const total = await jobsCol.countDocuments(match);
  const rows = await jobsCol
    .find(match)
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  // Support extra optional fields if you ever add them to docs
  const jobs = rows.map((r: any) => ({
    _id: r._id.toString(),
    title: r.title,
    company: r.company,
    location: r.location ?? null,
    url: r.url ?? null,
    createdAt: r.createdAt,
    jobType: r.jobType ?? null,
    salary: r.salary ?? null,
    description: r.description ?? null,
    companyLogo: r.companyLogo ?? null,
    tags: Array.isArray(r.tags) ? r.tags : [],
  }));

  return NextResponse.json({ jobs, page, limit, total });
}

export async function POST(req: Request) {
  // retained for future admin/seed use
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
