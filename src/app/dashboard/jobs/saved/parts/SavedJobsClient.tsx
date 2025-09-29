"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Job = {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  url?: string | null;
  createdAt: string;
  jobType?: string | null;
  salary?: string | null;
  description?: string | null;
  companyLogo?: string | null;
  tags?: string[];
};

export default function SavedJobsClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function load() {
    setLoading(true);
    const r = await fetch("/api/jobs/saved", { cache: "no-store" });
    const d = await r.json();
    setJobs(d.saved || []);
    setLoading(false);
  }

  async function unsave(id: string) {
    await fetch(`/api/jobs/saved/${id}`, { method: "DELETE" });
    load();
    router.refresh?.();
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return <div className="rounded-2xl border bg-white p-6 text-center text-gray-800">Loading…</div>;
  }
  if (jobs.length === 0) {
    return <div className="rounded-2xl border bg-white p-10 text-center text-gray-800">No saved jobs yet.</div>;
  }

  return (
    <ul className="space-y-3">
      {jobs.map((job) => (
        <li key={job.id} className="rounded-xl border bg-white p-4 hover:shadow">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">              {job.companyLogo ? (
                <img src={job.companyLogo} alt={`${job.company} logo`} className="h-10 w-10 rounded object-contain" />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded bg-gray-100 text-sm font-semibold text-gray-700">
                  {job.company?.[0]?.toUpperCase() ?? "•"}
                </div>
              )}
              <div>
                <div className="text-lg font-semibold">{job.title}</div>
                <div className="text-sm text-gray-700">
                  {job.company} {job.location ? `• ${job.location}` : ""}
                </div>
              </div>
            </div>
            <div className="shrink-0 text-sm text-gray-500">
              {new Date(job.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
            {job.jobType && <span className="rounded-full bg-gray-100 px-2 py-1">{job.jobType}</span>}
            {job.salary && <span className="rounded-full bg-gray-100 px-2 py-1">{job.salary}</span>}
            {job.tags && job.tags.slice(0, 4).map((t, i) => (
              <span key={i} className="rounded-full bg-gray-100 px-2 py-1">{t}</span>
            ))}
          </div>

          {job.description && (
            <div className="mt-3 whitespace-pre-wrap text-sm text-gray-900">{job.description}</div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
              >
                See the job posting
              </a>
            )}
            <button
              onClick={() => unsave(job.id)}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100"
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

