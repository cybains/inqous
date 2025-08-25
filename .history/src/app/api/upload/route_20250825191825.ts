import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import getMongoClient from "../../../lib/mongo";
import { GridFSBucket } from "mongodb";
import { Readable } from "stream";

export const runtime = "nodejs";

// Set your upstream Flask endpoint here (or use env)
const UPSTREAM_URL = process.env.UPSTREAM_UPLOAD_URL || "http://localhost:5000/upload";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // 1) Forward to Flask extractor
  const upstreamForm = new FormData();
  upstreamForm.append("file", file, file.name);
  const upstreamRes = await fetch(UPSTREAM_URL, { method: "POST", body: upstreamForm });
  if (!upstreamRes.ok) {
    const text = await upstreamRes.text().catch(() => "");
    return NextResponse.json({ error: "Upstream error", detail: text }, { status: upstreamRes.status });
  }
  const extracted = await upstreamRes.json();

  // 2) Save original file to Mongo GridFS and metadata+text to "documents"
  const arrayBuf = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);

  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_DB || "app");

  // GridFS: userfiles bucket
  const bucket = new GridFSBucket(db, { bucketName: "userfiles" });
  const uploadStream = bucket.openUploadStream(file.name, {
    contentType: (file as any).type || "application/octet-stream",
    metadata: { userId: session.user.id },
  });

  await new Promise<void>((resolve, reject) => {
    Readable.from(buffer).pipe(uploadStream)
      .on("error", reject)
      .on("finish", () => resolve());
  });

  const gridFsId = uploadStream.id; // ObjectId

  // Insert metadata doc
  const documents = db.collection("documents");
  const doc = {
    userId: session.user.id,
    filename: file.name,
    contentType: (file as any).type || null,
    size: buffer.length,
    fileId: gridFsId,
    // Store text + metadata returned from Flask
    extractedText: extracted?.text ?? extracted?.extracted_text ?? null,
    warnings: extracted?.warnings ?? [],
    meta: extracted?.metadata ?? {},
    createdAt: new Date().toISOString(),
  };
  const ins = await documents.insertOne(doc);

  return NextResponse.json({
    ok: true,
    documentId: ins.insertedId.toString(),
    fileId: gridFsId?.toString?.() ?? null,
    extractor: extracted,
  });
}
