import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import getMongoClient from "../../../lib/mongo";
import { GridFSBucket } from "mongodb";
import { Readable } from "stream";

export const runtime = "nodejs";

// Optional upstream Flask extractor
const UPSTREAM_URL = process.env.UPSTREAM_UPLOAD_URL || "http://localhost:5000/upload";

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

    // 1) Try extractor (non-fatal if it fails)
    let extracted: any = null;
    try {
      const upstreamForm = new FormData();
      upstreamForm.append("file", file, file.name);
      const upstreamRes = await fetch(UPSTREAM_URL, { method: "POST", body: upstreamForm });
      if (upstreamRes.ok) {
        extracted = await upstreamRes.json();
      } else {
        const detail = await upstreamRes.text().catch(() => "");
        extracted = { warnings: [`Extractor error: ${upstreamRes.status}`, detail] };
      }
    } catch (err: any) {
      extracted = { warnings: ["Extractor unreachable"], detail: err?.message ?? String(err) };
    }

    // 2) Store original file in Mongo (GridFS) + metadata in "documents"
    const buffer = Buffer.from(await file.arrayBuffer());

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
      extractedText: extracted?.text ?? extracted?.extracted_text ?? null,
      warnings: extracted?.warnings ?? [],
      meta: extracted?.metadata ?? {},
      createdAt: new Date().toISOString(),
    };

    const ins = await db.collection("documents").insertOne(doc);

    return NextResponse.json({
      ok: true,
      documentId: ins.insertedId.toString(),
      fileId: gridFsId?.toString?.() ?? null,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed", detail: err?.message ?? String(err) }, { status: 500 });
  }
}
