import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import getMongoClient from "../../../../../lib/mongo";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

// DELETE: unsave
export async function DELETE(
  _req: Request,
  { params }: { params: { jobId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobId = params.jobId;
  if (!jobId || !ObjectId.isValid(jobId)) {
    return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
  }

  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_JOBS_DB || "jobsdb");
  await db.collection("saved_jobs").deleteOne({
    userId: session.user.id,
    jobId: new ObjectId(jobId),
  });

  return NextResponse.json({ ok: true });
}
