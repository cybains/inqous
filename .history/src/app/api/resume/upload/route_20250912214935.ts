// app/api/resume/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import getMongoClient from "@/lib/mongo";
import { writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const fullName = String(form.get("fullName") || "");
  const isLatest = String(form.get("isLatest") || "false") === "true";

  if (!file || !fullName) return NextResponse.json({ error: "Missing file or name" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || ".bin";
  const id = randomUUID();
  const filename = `${id}${ext}`;
  const outPath = path.join("/tmp", filename);
  await writeFile(outPath, buffer);

  const doc = {
    _id: id,
    userId,
    type: "resume",
    originalFileName: file.name,
    mimeType: file.type,
    size: file.size,
    storage: { kind: "local_tmp", path: outPath }, // swap to S3 in prod
    isLatest,
    fullName,
    status: "uploaded", // uploaded | parsed | verified | needs_verification
    tick: "grey",       // grey | yellow | green | red
    createdAt: new Date(),
    parsedAt: null as Date | null,
    verifiedAt: null as Date | null,
  };

  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_JOBS_DB || "jobsdb");
  await db.collection("documents").insertOne(doc);

  // You can kick off your parse/enrich worker here (queue/webhook)
  return NextResponse.json({ documentId: id });
}
