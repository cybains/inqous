import SavedJobsClient from "/parts/SavedJobsClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function SavedJobsPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Your Jobs</h1>
          <p className="mt-1 text-sm text-gray-900">Jobs you’ve saved.</p>
        </div>
        <a href="/dashboard/jobs" className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
          Back to Browse
        </a>
      </header>
      <SavedJobsClient />
    </div>
  );
}
