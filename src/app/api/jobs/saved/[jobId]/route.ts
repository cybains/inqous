import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import getMongoClient from "../../../../../lib/mongo";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

// DELETE unsave (accepts jobId string or ObjectId string)
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await context.params;
  const client = await getMongoClient();
  const dbName = process.env.MONGODB_JOBS_DB || process.env.MONGODB_DB_NAME || "jobsdb";
  const db = client.db(dbName);

  const or: any[] = [{ jobId }];
  if (ObjectId.isValid(jobId)) or.push({ jobId: new ObjectId(jobId) });

  await db.collection("saved_jobs").deleteOne({
    userId: session.user.id,
    $or: or,
  });

  return NextResponse.json({ ok: true });
}
