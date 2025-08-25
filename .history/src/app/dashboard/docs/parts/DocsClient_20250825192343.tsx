"use client";

import { useEffect, useState } from "react";

type Doc = {
  _id: string;
  filename: string;
  contentType: string | null;
  size: number | null;
  createdAt: string;
};

function formatBytes(n?: number | null) {
  if (!n) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0, v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(1)} ${units[i]}`;
}

export default function DocsClient() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/docs", { cache: "no-store" });
    const data = await res.json();
    setDocs(data.docs ?? []);
    setLoading(false);
  }

  async function remove(id: string) {
    await fetch(`/api/docs/${id}`, { method: "DELETE" });
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-gray-50 text-gray-800">
          <tr>
            <th className="px-4 py-3">File</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Uploaded</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="text-gray-900">
          {loading ? (
            <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-800">Loading…</td></tr>
          ) : docs.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-800">No documents yet. Use “Upload resume” on the dashboard.</td></tr>
          ) : (
            docs.map(d => (
              <tr key={d._id} className="border-t">
                <td className="px-4 py-3 font-medium">{d.filename}</td>
                <td className="px-4 py-3">{d.contentType ?? "—"}</td>
                <td className="px-4 py-3">{formatBytes(d.size)}</td>
                <td className="px-4 py-3">{new Date(d.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => remove(d._id)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
