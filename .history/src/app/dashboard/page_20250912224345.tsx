// app/(dashboard)/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import getMongoClient from "@/lib/mongo";
import ResumeUploadDialog from "@/components/compass/ResumeUploadDialog";

async function getJobsCount(userId: string) {
  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_JOBS_DB || "jobsdb");
  return db.collection("jobs").countDocuments({ userId });
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const jobsCount = userId ? await getJobsCount(userId) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Compass</h1>
        <p className="mt-1 text-sm text-gray-700">Welcome back, {session?.user?.name ?? session?.user?.email}.</p>
      </div>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <CardStat title="Jobs" value={jobsCount} subtitle="Total jobs in your workspace" />
        <CardStat title="Resumes" value="—" subtitle="Upload below" />
        <CardStat title="Last Login" value={new Date().toLocaleString()} subtitle="Local time" />
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">Quick actions</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a href="/dashboard/opportunities/discover" className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800">Discover Jobs</a>
          <ResumeUploadDialog />
        </div>
      </section>
    </div>
  );
}

function CardStat({ title, value, subtitle }: any) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-sm text-gray-800">{title}</div>
      <div className="mt-2 text-3xl font-semibold text-gray-900">{value}</div>
      <div className="mt-2 text-xs text-gray-600">{subtitle}</div>
    </div>
  );
}
