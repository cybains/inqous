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
  const dbName = process.env.MONGODB_JOBS_DB || process.env.MONGODB_DB_NAME || "jobsdb";
  const db = client.db(dbName);
  const jobsCol = db.collection("jobs");
  const savedCol = db.collection("saved_jobs");

  // Indexes (safe to call repeatedly)
  await Promise.all([
    jobsCol.createIndexes([
      { key: { createdAt: -1, _id: -1 }, name: "created_desc" },
      { key: { title: 1 }, name: "title" },
      { key: { company: 1 }, name: "company" },
      { key: { company_name: 1 }, name: "company_name" },
      { key: { location: 1 }, name: "location" },
      { key: { candidate_required_location: 1 }, name: "candidate_required_location" },
    ]),
    savedCol.createIndex({ userId: 1, jobId: 1 }, { name: "uniq_user_job", unique: true }),
  ]);

  // Saved ids for this user (stringify for universal comparison)
  const savedRows = await savedCol.find({ userId: session.user.id }).project({ jobId: 1 }).toArray();
  const savedIdStrings = savedRows.map((s: any) =>
    typeof s.jobId === "string" ? s.jobId : (s.jobId?._id ?? s.jobId)?.toString?.() ?? String(s.jobId)
  );

  // Base filters: union of sources (shared + personal)
  const baseMatch: any = {
    $or: [
      { userId: { $exists: false } },
      { userId: null },
      { userId: "shared" },
      { userId: session.user.id },
    ],
  };

  // Text filters (support both field name variants)
  const and: any[] = [baseMatch];
  if (q) {
    const rx = new RegExp(escRx(q), "i");
    and.push({
      $or: [
        { title: rx },
        { company: rx },
        { company_name: rx },
        { location: rx },
        { candidate_required_location: rx },
      ],
    });
  }
  if (company) {
    const rx = new RegExp(escRx(company), "i");
    and.push({ $or: [{ company: rx }, { company_name: rx }] });
  }
  if (location) {
    const rx = new RegExp(escRx(location), "i");
    and.push({ $or: [{ location: rx }, { candidate_required_location: rx }] });
  }

  // Build aggregate so we can exclude saved by stringified _id
  const matchStage = and.length ? { $match: { $and: and } } : { $match: {} };

  const pipeline = [
    matchStage,
    { $addFields: { _idStr: { $toString: "$_id" } } },
    savedIdStrings.length ? { $match: { _idStr: { $nin: savedIdStrings } } } : null,
    { $sort: { createdAt: -1, _id: -1 } as any },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ].filter(Boolean) as any[];

  const totalPipeline = [
    matchStage,
    { $addFields: { _idStr: { $toString: "$_id" } } },
    savedIdStrings.length ? { $match: { _idStr: { $nin: savedIdStrings } } } : null,
    { $count: "n" },
  ].filter(Boolean) as any[];

  const [rows, totalRow] = await Promise.all([
    jobsCol.aggregate(pipeline).toArray(),
    jobsCol.aggregate(totalPipeline).toArray(),
  ]);

  const total = totalRow?.[0]?.n ?? 0;

  // Normalize fields to a single UI shape
  const jobs = rows.map((r: any) => ({
    id: r._id.toString(), // always string for the client
    title: r.title,
    company: r.company ?? r.company_name ?? "",
    location: r.location ?? r.candidate_required_location ?? null,
    url: r.url ?? null,
    createdAt: r.createdAt ?? r.publication_date ?? new Date(r._id.getTimestamp?.() ?? Date.now()).toISOString(),
    jobType: r.jobType ?? r.job_type ?? null,
    salary: r.salary ?? null,
    description: r.description ?? null, // can be HTML from external importers
    companyLogo: r.companyLogo ?? r.company_logo ?? null,
    tags: Array.isArray(r.tags) ? r.tags : [],
  }));

  return NextResponse.json({ jobs, page, limit, total });
}
