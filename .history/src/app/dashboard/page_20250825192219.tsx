import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import getMongoClient from "../../lib/mongo";
import UploadResumeClient from "./parts/UploadResumeClient";

async function getJobsCount(userId: string) {
  const client = await getMongoClient();
  const dbName = process.env.MONGODB_JOBS_DB || "jobsdb";
  const db = client.db(dbName);
  return db.collection("jobs").countDocuments({ userId });
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id as string;
  const jobsCount = userId ? await getJobsCount(userId) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-900">
          Hello, {session?.user?.name ?? session?.user?.email}!
        </p>
      </div>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-800">Jobs</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">{jobsCount}</div>
          <div className="mt-2 text-xs text-gray-800">Total jobs in your workspace</div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-800">Resumes</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">—</div>
          <div className="mt-2 text-xs text-gray-800">Upload below</div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-800">Last Login</div>
          <div className="mt-2 text-xl text-gray-900">{new Date().toLocaleString()}</div>
          <div className="mt-2 text-xs text-gray-800">Local time</div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">Quick actions</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href="/dashboard/jobs"
            className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800"
          >
            View Jobs
          </a>
          <UploadResumeClient />
        </div>
      </section>
    </div>
  );
}
