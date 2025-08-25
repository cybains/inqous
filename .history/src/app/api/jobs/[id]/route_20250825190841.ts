import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import getMongoClient from "../../../../lib/mongo";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

function cleanStr(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, any> = {};
  if (typeof body.title === "string") updates.title = cleanStr(body.title);
  if (typeof body.company === "string") updates.company = cleanStr(body.company);
  if (typeof body.location === "string") updates.location = cleanStr(body.location) || null;
  if (typeof body.url === "string") updates.url = cleanStr(body.url) || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_JOBS_DB || "jobsdb");

  const res = await db.collection("jobs").updateOne(
    { _id: new ObjectId(id), userId: session.user.id },
    { $set: { ...updates } }
  );

  if (res.matchedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_JOBS_DB || "jobsdb");

  const res = await db.collection("jobs").deleteOne({
    _id: new ObjectId(id),
    userId: session.user.id,
  });

  if (res.deletedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
