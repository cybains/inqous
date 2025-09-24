import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import getMongoClient from "../../../lib/mongo";
import { GridFSBucket } from "mongodb";
import { Readable } from "stream";
import { extractResume } from "../../../lib/resume-extractor";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1) Extract the textual content locally (no external runtime required)
    const extracted = await extractResume({
      buffer,
      filename: file.name,
    });

    // 2) Store original file in Mongo (GridFS) + metadata in "documents"

    const client = await getMongoClient();
    const db = client.db(process.env.MONGODB_DB || "app");

    // Put raw file bytes into GridFS
    const bucket = new GridFSBucket(db, { bucketName: "userfiles" });
    const uploadStream = bucket.openUploadStream(file.name, {
      contentType: (file as any).type || "application/octet-stream",
      metadata: { userId: session.user.id },
    });

    await new Promise<void>((resolve, reject) => {
      Readable.from(buffer).pipe(uploadStream).on("error", reject).on("finish", () => resolve());
    });

    const gridFsId = uploadStream.id; // ObjectId

    // Insert metadata + extracted text
    const doc = {
      userId: session.user.id,
      filename: file.name,
      contentType: (file as any).type || null,
      size: buffer.length,
      fileId: gridFsId,
      extractedText: extracted.text,
      warnings: extracted.warnings,
      meta: extracted.meta,
      createdAt: new Date().toISOString(),
    };

    const ins = await db.collection("documents").insertOne(doc);

    return NextResponse.json({
      ok: true,
      documentId: ins.insertedId.toString(),
      fileId: gridFsId?.toString?.() ?? null,
    });
  } catch (err: unknown) {
    console.error("Upload error:", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Upload failed", detail }, { status: 500 });
  }
}
