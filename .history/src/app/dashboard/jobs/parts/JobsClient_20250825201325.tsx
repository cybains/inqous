"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Job = {
  _id: string;
  title: string;
  company: string;
  location?: string | null;
  url?: string | null;
  createdAt: string;
  jobType?: string | null;
  salary?: string | null;
  description?: string | null; // HTML or text
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
  const [page, setPage] = useState(pageParam);
  const [limit] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // filters (controlled inputs)
  const [q, setQ] = useState(qParam);
  const [company, setCompany] = useState(companyParam);
  const [location, setLocation] = useState(locationParam);

  // expand state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadList(p = pageParam, qp = qParam, cp = companyParam, lp = locationParam) {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("limit", String(PAGE_SIZE));
    if (qp) params.set("q", qp);
    if (cp) params.set("company", cp);
    if (lp) params.set("location", lp);
    const res = await fetch(`/api/jobs?${params.toString()}`, { cache: "no-store" });
    const data: JobsResp = await res.json();
    setJobs(data.jobs || []);
    setPage(data.page || p);
    setTotal(data.total || 0);
    setLoading(false);
    setExpandedId(null);
  }

  function applyFilters(nextPage = 1) {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (company.trim()) params.set("company", company.trim());
    if (location.trim()) params.set("location", location.trim());
    params.set("page", String(nextPage));
    router.push(`/dashboard/jobs?${params.toString()}`);
  }

  useEffect(() => {
    loadList(pageParam, qParam, companyParam, locationParam);
    setQ(qParam);
    setCompany(companyParam);
    setLocation(locationParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageParam, qParam, companyParam, locationParam]);

  // pagination numbers with smart ellipses
  const pages = useMemo(() => {
    const items: number[] = [];
    const totalP = totalPages;
    const cur = pageParam;
    const add = (n: number) => { if (n >= 1 && n <= totalP && !items.includes(n)) items.push(n); };
    add(1); add(2);
    add(cur - 1); add(cur); add(cur + 1);
    add(totalP - 1); add(totalP);
    return items.sort((a, b) => a - b);
  }, [pageParam, totalPages]);

  async function save(jobId: string) {
    await fetch("/api/jobs/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    // Remove from current feed (since main feed excludes saved)
    loadList(pageParam, qParam, companyParam, locationParam);
  }

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search all fields…"
            className="rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-black/10"
          />
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company"
            className="rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-black/10"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-black/10"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => applyFilters(1)}
              className="w-full rounded-lg bg.black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 bg-black"
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

      {/* Feed (cards) */}
      {loading ? (
        <div className="rounded-2xl border bg-white p-6 text-center text-gray-800">Loading…</div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-gray-800">
          No jobs match. Adjust your filters.
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => {
            const isExpanded = expandedId === job._id;
            return (
              <div
                key={job._id}
                className="cursor-pointer rounded-xl border bg-white p-4 hover:shadow"
                onClick={() => setExpandedId(isExpanded ? null : job._id)}
              >
                {/* header row */}
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* logo or fallback */}
                    {job.companyLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={job.companyLogo}
                        alt={`${job.company} logo`}
                        className="h-10 w-10 rounded object-contain"
                        onClick={(e) => e.stopPropagation()}
                      />
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

                  <div className="text-sm text-gray-500">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* compact row */}
                {!isExpanded && (
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
                    {job.jobType && <span>{job.jobType}</span>}
                    {job.salary && <span>{job.salary}</span>}
                    {job.tags && job.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {job.tags.slice(0, 3).map((t, i) => (
                          <span key={i} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* expanded body */}
                {isExpanded && (
                  <div className="mt-3 space-y-3 text-sm text-gray-900">
                    {job.description && (
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: job.description }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
                        >
                          See the job posting
                        </a>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); save(job._id); }}
                        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* collapsed footer actions */}
                {!isExpanded && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); save(job._id); }}
                      className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-100"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => applyFilters(Math.max(1, pageParam - 1))}
          disabled={pageParam <= 1}
          className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
        >
          Previous
        </button>

        {useMemo(() => {
          const elems: JSX.Element[] = [];
          const list = pages;
          for (let i = 0; i < list.length; i++) {
            const p = list[i];
            const prev = list[i - 1];
            if (prev && p - prev > 1) {
              elems.push(<span key={`dots-${p}`} className="px-1">…</span>);
            }
            elems.push(
              <button
                key={`page-${p}`}
                onClick={() => applyFilters(p)}
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
          onClick={() => applyFilters(Math.min(totalPages, pageParam + 1))}
          disabled={pageParam >= totalPages}
          className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
