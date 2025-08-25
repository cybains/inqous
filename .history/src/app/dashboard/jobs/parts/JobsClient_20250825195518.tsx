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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [q, setQ] = useState(qParam);
  const [company, setCompany] = useState(companyParam);
  const [location, setLocation] = useState(locationParam);

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [saved, setSaved] = useState<Job[]>([]);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function applyFilters(nextPage = 1) {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (company.trim()) params.set("company", company.trim());
    if (location.trim()) params.set("location", location.trim());
    params.set("page", String(nextPage));
    router.push(`/dashboard/jobs?${params.toString()}`);
  }

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

  async function loadSaved() {
    const r = await fetch("/api/jobs/saved", { cache: "no-store" });
    const d = await r.json();
    setSavedIds(d.savedIds || []);
    setSaved(d.saved || []);
  }

  async function save(id: string) {
    await fetch("/api/jobs/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: id }),
    });
    loadSaved();
  }

  async function unsave(id: string) {
    await fetch(`/api/jobs/saved/${id}`, { method: "DELETE" });
    loadSaved();
  }

  useEffect(() => {
    // when URL params change, reload list and saved
    loadList(pageParam, qParam, companyParam, locationParam);
    loadSaved();
    setQ(qParam);
    setCompany(companyParam);
    setLocation(locationParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageParam, qParam, companyParam, locationParam]);

  const pages = useMemo(() => {
    const items: number[] = [];
    const totalP = totalPages;
    const cur = pageParam;

    const add = (n: number) => { if (n >= 1 && n <= totalP && !items.includes(n)) items.push(n); };

    add(1);
    add(2);
    add(cur - 1);
    add(cur);
    add(cur + 1);
    add(totalP - 1);
    add(totalP);

    return items
      .filter(n => n >= 1 && n <= totalP)
      .sort((a, b) => a - b);
  }, [pageParam, totalPages]);

  return (
    <div className="space-y-6">
      {/* Filter bar (robust) */}
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
              className="w-full rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Apply filters
            </button>
            {/* Hidden developer helpers kept in code but not shown */}
            {/* <button onClick={() => setShowAdd(true)} className="rounded-lg border px-3 py-2 text-sm">New job</button> */}
            {/* <button onClick={seed} className="rounded-lg border px-3 py-2 text-sm">Add demo data</button> */}
          </div>
        </div>
      </div>

      {/* Table (click row to expand) */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-gray-800">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Link</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3 text-right">Save</th>
            </tr>
          </thead>
          <tbody className="text-gray-900">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-800">Loading…</td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-800">No jobs match. Adjust your filters.</td>
              </tr>
            ) : (
              jobs.map((j) => {
                const expanded = expandedId === j._id;
                const isSaved = savedIds.includes(j._id);
                return (
                  <FragmentRow
                    key={j._id}
                    job={j}
                    expanded={expanded}
                    onToggle={() => setExpandedId(expanded ? null : j._id)}
                    isSaved={isSaved}
                    onSave={() => save(j._id)}
                    onUnsave={() => unsave(j._id)}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => applyFilters(Math.max(1, pageParam - 1))}
          disabled={pageParam <= 1}
          className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
        >
          Previous
        </button>

        {/* compact pages with ellipses */}
        {pages.map((p, idx) => {
          const prev = pages[idx - 1];
          const gap = prev ? p - prev : 0;
          return (
            <span key={`p-${p}`} className="flex items-center">
              {gap > 1 && <span className="px-2">…</span>}
              <button
                onClick={() => applyFilters(p)}
                className={[
                  "rounded-lg border px-3 py-2 text-sm",
                  p === pageParam ? "bg-black text-white" : "bg-white"
                ].join(" ")}
              >
                {p}
              </button>
            </span>
          );
        })}

        <button
          onClick={() => applyFilters(Math.min(totalPages, pageParam + 1))}
          disabled={pageParam >= totalPages}
          className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Your Jobs (saved list) */}
      {saved.length > 0 && (
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Your Jobs</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {saved.map((j) => (
              <div key={j._id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{j.title}</div>
                  <button
                    onClick={() => unsave(j._id)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-1 text-sm text-gray-700">{j.company} • {j.location ?? "—"}</div>
                <div className="mt-1 text-xs text-gray-500">Added {new Date(j.createdAt).toLocaleDateString()}</div>
                {j.url && (
                  <a
                    href={j.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-blue-700 underline"
                  >
                    Open posting
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Helper: expandable table row component
function FragmentRow({
  job, expanded, onToggle, isSaved, onSave, onUnsave,
}: {
  job: Job;
  expanded: boolean;
  onToggle: () => void;
  isSaved: boolean;
  onSave: () => void;
  onUnsave: () => void;
}) {
  return (
    <>
      <tr className="border-t hover:bg-gray-50 cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-3 font-medium">{job.title}</td>
        <td className="px-4 py-3">{job.company}</td>
        <td className="px-4 py-3">{job.location ?? "—"}</td>
        <td className="px-4 py-3">
          {job.url ? (
            <a href={job.url} target="_blank" rel="noreferrer" className="text-blue-700 underline" onClick={(e) => e.stopPropagation()}>
              Open
            </a>
          ) : "—"}
        </td>
        <td className="px-4 py-3">{new Date(job.createdAt).toLocaleDateString()}</td>
        <td className="px-4 py-3 text-right">
          {isSaved ? (
            <button onClick={(e) => { e.stopPropagation(); onUnsave(); }} className="rounded-lg border px-2 py-1 text-xs bg-gray-900 text-white">
              Saved
            </button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); onSave(); }} className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-100">
              Save
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="border-t">
          <td colSpan={6} className="px-4 py-4 bg-gray-50">
            <div className="text-sm text-gray-900">
              <div><span className="font-medium">Title:</span> {job.title}</div>
              <div><span className="font-medium">Company:</span> {job.company}</div>
              <div><span className="font-medium">Location:</span> {job.location ?? "—"}</div>
              <div><span className="font-medium">Created:</span> {new Date(job.createdAt).toLocaleString()}</div>
              {job.url && (
                <div className="mt-2">
                  <a href={job.url} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                    View job posting
                  </a>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
