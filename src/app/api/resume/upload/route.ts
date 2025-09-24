// app/api/resume/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import getMongoClient from "@/lib/mongo";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

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

  const bytes = Buffer.from(await file.arrayBuffer());
  const fileToken = randomUUID();
  const ext = path.extname(file.name) || ".bin";
  const filename = `${fileToken}${ext}`;
  const outPath = path.join("/tmp", filename);
  await writeFile(outPath, bytes);

  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_JOBS_DB || "jobsdb");
  const inserted = await db.collection("documents").insertOne({
    userId,
    type: "resume",
    fullName,
    originalFileName: file.name,
    mimeType: file.type,
    size: file.size,
    storage: { kind: "local_tmp", path: outPath, filename },
    isLatest,
    status: "uploaded", // uploaded | parsed | verified | needs_verification
    tick: "grey",       // grey | yellow | green | red
    createdAt: new Date(),
    parsedAt: null,
    verifiedAt: null,
  });

  // TODO: enqueue parse/enrich worker here
  return NextResponse.json({ documentId: inserted.insertedId.toString() });
}
