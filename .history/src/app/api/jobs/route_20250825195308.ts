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

  const match: any = { userId: session.user.id };
  const and: any[] = [];

  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    and.push({ $or: [{ title: rx }, { company: rx }, { location: rx }] });
  }
  if (company) {
    const rx = new RegExp(company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    and.push({ company: rx });
  }
  if (location) {
    const rx = new RegExp(location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    and.push({ location: rx });
  }
  if (and.length) match.$and = and;

  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_JOBS_DB || "jobsdb");
  const col = db.collection("jobs");

  // helpful indexes (safe to call repeatedly)
  await col.createIndexes([
    { key: { userId: 1, createdAt: -1 }, name: "user_createdAt" },
    { key: { userId: 1, title: 1 }, name: "user_title" },
    { key: { userId: 1, company: 1 }, name: "user_company" },
    { key: { userId: 1, location: 1 }, name: "user_location" },
  ]);

  const total = await col.countDocuments(match);
  const rows = await col
    .find(match)
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  const jobs = rows.map((r: any) => ({
    _id: r._id.toString(),
    title: r.title,
    company: r.company,
    location: r.location ?? null,
    url: r.url ?? null,
    createdAt: r.createdAt,
  }));

  return NextResponse.json({ jobs, page, limit, total });
}

export async function POST(req: Request) {
  // (kept so you can still add jobs programmatically or re-enable a form later)
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
