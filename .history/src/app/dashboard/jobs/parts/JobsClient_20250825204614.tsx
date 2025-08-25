"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Job = {
  id: string;                 // stringified _id from API
  title: string;
  company: string;
  location?: string | null;
  url?: string | null;
  createdAt: string;
  jobType?: string | null;
  salary?: string | null;
  description?: string | null; // safe to render as plain text
  companyLogo?: string | null;
  tags?: string[];
};

type JobsResp = {
  jobs: Job[];
  page: number;
  limit: number;
  total: number;
};

const PAGE_SIZE = 10;

export default function JobsClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const pageParam = parseInt(sp.get("page") || "1", 10);
  const qParam = sp.get("q") || "";
  const companyParam = sp.get("company") || "";
  const locationParam = sp.get("location") || "";

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState(qParam);
  const [company, setCompany] = useState(companyParam);
  const [location, setLocation] = useState(locationParam);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pushFilters(nextPage = 1) {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (company.trim()) params.set("company", company.trim());
    if (location.trim()) params.set("location", location.trim());
    params.set("page", String(nextPage));
    router.push(`/dashboard/jobs?${params.toString()}`);
  }

  async function loadList() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(pageParam));
    params.set("limit", String(PAGE_SIZE));
    if (qParam) params.set("q", qParam);
    if (companyParam) params.set("company", companyParam);
    if (locationParam) params.set("location", locationParam);

    const res = await fetch(`/api/jobs?${params.toString()}`, { cache: "no-store" });
    const data: JobsResp = await res.json();
    setJobs(data.jobs || []);
    setTotal(data.total || 0);
    setLoading(false);
    setExpandedId(null);
  }

  useEffect(() => {
    setQ(qParam);
    setCompany(companyParam);
    setLocation(locationParam);
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageParam, qParam, companyParam, locationParam]);

  // pagination buttons with ellipses
  const pages = useMemo(() => {
    const items: number[] = [];
    const cur = pageParam;
    const add = (n: number) => { if (n >= 1 && n <= totalPages && !items.includes(n)) items.push(n); };
    add(1); add(2);
    add(cur - 1); add(cur); add(cur + 1);
    add(totalPages - 1); add(totalPages);
    return items.sort((a, b) => a - b);
  }, [pageParam, totalPages]);

  async function save(jobId: string) {
    await fetch("/api/jobs/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    // Refresh current page — saved jobs are excluded from feed by API
    loadList();
  }

  function onFiltersKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") pushFilters(1);
  }

  return (
    <div className="space-y-6">
      {/* FILTER BAR */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onFiltersKey}
            placeholder="Search all fields…"
            className="rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-black/10"
          />
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            onKeyDown={onFiltersKey}
            placeholder="Company"
            className="rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-black/10"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={onFiltersKey}
            placeholder="Location"
            className="rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-black/10"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => pushFilters(1)}
              className="w-full rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Apply filters
            </button>
            <a
              href="/dashboard/jobs/saved"
              className="hidden sm:inline-block rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Your Jobs
            </a>
          </div>
        </div>
      </div>

      {/* FEED */}
      {loading ? (
        <div className="rounded-2xl border bg-white p-6 text-center text-gray-800">Loading…</div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-gray-800">
          No jobs match. Adjust your filters.
        </div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => {
            const expanded = expandedId === job.id;
            return (
              <li key={job.id} className="rounded-xl border bg-white p-4 hover:shadow">
                {/* TOP ROW */}
                <div
                  className="flex cursor-pointer items-start justify-between gap-3"
                  onClick={() => setExpandedId(expanded ? null : job.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {job.companyLogo ? (
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

                {/* CHIPS */}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-700">
                  {job.jobType && <span className="rounded-full bg-gray-100 px-2 py-1">{job.jobType}</span>}
                  {job.salary && <span className="rounded-full bg-gray-100 px-2 py-1">{job.salary}</span>}
                  {job.tags && job.tags.slice(0, 4).map((t, i) => (
                    <span key={i} className="rounded-full bg-gray-100 px-2 py-1">{t}</span>
                  ))}
                </div>

                {/* EXPANDED */}
                {expanded && (
                  <div className="mt-3 border-t pt-3 text-sm text-gray-900">
                    <div className="whitespace-pre-wrap">{job.description ?? "No description provided."}</div>
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
                        onClick={async () => { await save(job.id); }}
                        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* COLLAPSED ACTION */}
                {!expanded && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={async () => { await save(job.id); }}
                      className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-100"
                    >
                      Save
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* PAGINATION */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => pushFilters(Math.max(1, pageParam - 1))}
          disabled={pageParam <= 1}
          className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
        >
          Previous
        </button>

        {useMemo(() => {
          const elems: JSX.Element[] = [];
          for (let i = 0; i < pages.length; i++) {
            const p = pages[i];
            const prev = pages[i - 1];
            if (prev && p - prev > 1) elems.push(<span key={`dots-${p}`} className="px-2">…</span>);
            elems.push(
              <button
                key={`page-${p}`}
                onClick={() => pushFilters(p)}
                className={[
                  "rounded-lg border px-3 py-2 text-sm",
                  p === pageParam ? "bg-black text-white" : "bg-white",
                ].join(" ")}
              >
                {p}
              </button>
            );
          }
          return elems;
        }, [pages, pageParam])}

        <button
          onClick={() => pushFilters(Math.min(totalPages, pageParam + 1))}
          disabled={pageParam >= totalPages}
          className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
