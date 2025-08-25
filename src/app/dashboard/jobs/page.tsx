import JobsClient from "./parts/JobsClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Jobs</h1>
          <p className="mt-1 text-sm text-gray-900">Track roles you’re considering.</p>
        </div>
      </header>

      <JobsClient />
    </div>
  );
}
