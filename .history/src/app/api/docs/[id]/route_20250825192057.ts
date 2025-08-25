import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import getMongoClient from "../../../../lib/mongo";
import { ObjectId, GridFSBucket } from "mongodb";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_DB || "app");

  const doc = await db.collection("documents").findOne({ _id: new ObjectId(id), userId: session.user.id });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // delete GridFS file if present
  if (doc.fileId && ObjectId.isValid(doc.fileId)) {
    const bucket = new GridFSBucket(db, { bucketName: "userfiles" });
    try {
      await bucket.delete(new ObjectId(doc.fileId));
    } catch {
      // ignore; file might already be gone
    }
  }

  await db.collection("documents").deleteOne({ _id: new ObjectId(id), userId: session.user.id });
  return NextResponse.json({ ok: true });
}
