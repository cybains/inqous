"use client";

import { useEffect, useMemo, useState } from "react";

type Job = {
  _id: string;
  title: string;
  company: string;
  location?: string;
  url?: string;
  createdAt: string;
};

export default function JobsClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [form, setForm] = useState({ title: "", company: "", location: "", url: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/jobs", { cache: "no-store" });
    const data = await res.json();
    setJobs(data.jobs ?? []);
    setLoading(false);
  }

  async function addJob(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setForm({ title: "", company: "", location: "", url: "" });
    load();
  }

  async function seed() {
    await fetch("/api/jobs/seed", { method: "POST" });
    load();
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return jobs;
    return jobs.filter((j) =>
      [j.title, j.company, j.location ?? ""].join(" ").toLowerCase().includes(needle)
    );
  }, [jobs, q]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search jobs…"
            className="w-64 rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-black/10"
          />
          <button
            onClick={seed}
            className="rounded-lg border px-3 py-2 text-sm text-gray-900 hover:bg-gray-50"
            title="Add a few sample jobs"
          >
            Seed sample
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-gray-800">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Link</th>
              <th className="px-4 py-3">Added</th>
            </tr>
          </thead>
          <tbody className="text-gray-900">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-800">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-800">
                  No jobs yet. Use the form below or hit “Seed sample”.
                </td>
              </tr>
            ) : (
              filtered.map((j) => (
                <tr key={j._id} className="border-t">
                  <td className="px-4 py-3 font-medium">{j.title}</td>
                  <td className="px-4 py-3">{j.company}</td>
                  <td className="px-4 py-3">{j.location ?? "—"}</td>
                  <td className="px-4 py-3">
                    {j.url ? (
                      <a
                        href={j.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 underline"
                      >
                        Open
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(j.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add form */}
      <form onSubmit={addJob} className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">Add Job</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-800">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              className="rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-black/10"
              placeholder="Senior Backend Engineer"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-800">Company</label>
            <input
              required
              value={form.company}
              onChange={(e) => setForm((s) => ({ ...s, company: e.target.value }))}
              className="rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-black/10"
              placeholder="Acme Inc."
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-800">Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
              className="rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-black/10"
              placeholder="Vienna, AT"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-800">URL</label>
            <input
              value={form.url}
              onChange={(e) => setForm((s) => ({ ...s, url: e.target.value }))}
              className="rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-black/10"
              placeholder="https://jobs.example.com/123"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            disabled={saving}
            className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save job"}
          </button>
        </div>
      </form>
    </div>
  );
}
