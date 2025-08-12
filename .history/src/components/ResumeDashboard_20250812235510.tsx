"use client";

import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { signOut } from "next-auth/react";

type UserLite = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type UploadResult = {
  text: string;
  meta?: Record<string, any>;
  warnings?: string[];
};

export default function ResumeDashboard({ user }: { user?: UserLite }) {
  const [serverURL, setServerURL] = useState("/api/upload"); // proxy route
  const [lang, setLang] = useState("eng");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onPick = () => inputRef.current?.click();

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
      setError(null);
    }
  }, []);

  const onUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      const url = `${serverURL}?lang=${encodeURIComponent(lang)}`;
      const res = await fetch(url, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }
      setResult({
        text: data.text ?? "",
        meta: data.meta,
        warnings: data.warnings,
      });
    } catch (e: any) {
      setError(e?.message || "Unexpected error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* Sidebar */}
      <aside className="w-80 border-r border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-4">
        {/* User card */}
        <div className="flex items-center gap-3">
          {user?.image ? (
            <img
              src={user.image}
              alt="avatar"
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          )}
          <div className="min-w-0">
            <div className="font-medium truncate">{user?.name ?? "User"}</div>
            <div className="text-xs text-neutral-500 truncate">
              {user?.email ?? ""}
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-sm self-start px-3 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900"
        >
          Sign out
        </button>

        <div className="text-xs uppercase tracking-wider text-neutral-500 mt-2">
          Resume Upload
        </div>

        {/* Controls */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm w-28">OCR language</label>
            <input
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="flex-1 border rounded px-2 py-1 text-sm bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
              placeholder="e.g., eng, deu, fra"
            />
          </div>

          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs underline text-neutral-500"
          >
            {showAdvanced ? "Hide" : "Show"} advanced
          </button>

          {showAdvanced && (
            <div className="flex items-center gap-2">
              <label className="text-sm w-28">Upload URL</label>
              <input
                value={serverURL}
                onChange={(e) => setServerURL(e.target.value)}
                className="flex-1 border rounded px-2 py-1 text-sm bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
              />
            </div>
          )}
        </div>

        {/* File details */}
        <div className="mt-4 text-sm">
          <div className="font-medium mb-1">Selected file</div>
          <div className="text-neutral-500">
            {file ? file.name : "None selected"}
          </div>
        </div>

        <div className="mt-auto text-xs text-neutral-500">
          Supported: PDF, DOCX, ODT, TXT, RTF, PNG, JPG
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="h-12 border-b border-neutral-200 dark:border-neutral-800 flex items-center px-4 justify-between">
          <div className="font-medium">Resume Extractor</div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPick}
              className="px-3 py-1.5 text-sm rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              Choose file…
            </button>
            <button
              onClick={onUpload}
              disabled={!file || isUploading}
              className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white disabled:opacity-50"
            >
              {isUploading ? "Uploading…" : "Upload & extract"}
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                setResult(null);
                setError(null);
              }}
              accept=".pdf,.docx,.odt,.txt,.rtf,.png,.jpg,.jpeg"
            />
          </div>
        </div>

        {/* Work area */}
        <div
          className="flex-1 p-6 overflow-auto"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          {!file && !result && !error && (
            <div className="h-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl flex items-center justify-center text-neutral-500">
              Drag & drop a resume here, or use “Choose file…”
            </div>
          )}

          {file && !result && !error && (
            <div className="text-neutral-600 dark:text-neutral-300">
              Ready to upload: <b>{file.name}</b>
            </div>
          )}

          {isUploading && (
            <div className="text-neutral-600 dark:text-neutral-300">
              Processing… this can take a few seconds for scans.
            </div>
          )}

          {error && (
            <div className="text-red-600">
              Error: {error}
            </div>
          )}

          {result && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2">
                <h2 className="font-semibold mb-2">Extracted text</h2>
                <pre className="whitespace-pre-wrap text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded p-4">
{result.text || "(empty)"}
                </pre>
              </section>
              <aside className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">Metadata</h3>
                  <pre className="text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded p-3 overflow-auto">
{JSON.stringify(result.meta ?? {}, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Warnings</h3>
                  {(!result.warnings || result.warnings.length === 0) ? (
                    <div className="text-xs text-neutral-500">None</div>
                  ) : (
                    <ul className="list-disc pl-5 text-xs">
                      {result.warnings!.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
