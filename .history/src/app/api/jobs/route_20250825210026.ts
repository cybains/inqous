import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import getMongoClient from "../../../lib/mongo";

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
  const limit = Math.min(MAX_LIMIT, num(url.searchParams.get("limit"), 20)); // default 20 to match template

  const q = str(url.searchParams.get("q"));
  const company = str(url.searchParams.get("company"));
  const location = str(url.searchParams.get("location"));

  const client = await getMongoClient();
  const dbName = process.env.MONGODB_JOBS_DB || process.env.MONGODB_DB_NAME || "jobsdb";
  const db = client.db(dbName);
  const jobsCol = db.collection("jobs");
  const savedCol = db.collection("saved_jobs");

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

  // saved ids for this user (as strings)
  const savedRows = await savedCol.find({ userId: session.user.id }).project({ jobId: 1 }).toArray();
  const savedIdStrings = savedRows.map((s: any) =>
    typeof s.jobId === "string" ? s.jobId : (s.jobId?._id ?? s.jobId)?.toString?.() ?? String(s.jobId)
  );

  // shared + personal
  const baseMatch: any = {
    $or: [
      { userId: { $exists: false } },
      { userId: null },
      { userId: "shared" },
      { userId: session.user.id },
    ],
  };

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

  const matchStage = { $match: { $and: and } };

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

  // Normalize + add Remotive-style aliases (+ category + seniority)
  const jobs = rows.map((r: any) => {
    const idString = r._id.toString();
    const created =
      r.createdAt ??
      r.publication_date ??
      (r._id?.getTimestamp?.() ? r._id.getTimestamp().toISOString() : new Date().toISOString());

    const company = r.company ?? r.company_name ?? "";
    const location = r.location ?? r.candidate_required_location ?? null;
    const jobType = r.jobType ?? r.job_type ?? null;
    const companyLogo = r.companyLogo ?? r.company_logo ?? null;
    const category = r.category ?? null;
    const seniority = r.seniority ?? r.seniority_level ?? null;

    const base = {
      id: idString,
      title: r.title,
      company,
      location,
      url: r.url ?? null,
      createdAt: created,
      jobType,
      salary: r.salary ?? null,
      description: r.description ?? null,
      companyLogo,
      tags: Array.isArray(r.tags) ? r.tags : [],
      category,
      seniority, // new unified key
    };

    // Remotive aliases for your template
    return {
      ...base,
      company_name: company,
      candidate_required_location: location,
      publication_date: created,
      job_type: jobType,
      company_logo: companyLogo,
    };
  });

  return NextResponse.json({ jobs, page, limit, total, totalJobs: total });
}
