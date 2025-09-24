"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

// Minimal ChatGPT-style layout with a left sidebar and a main conversation area.
// Includes a file uploader tailored for resumes that hits the built-in Next.js API route
// (POST /api/upload). Uses Tailwind CSS.
// Drop this into a Next.js/React app and make sure Tailwind is configured.

// ---- Utility types ----
type UploadResult = {
  text: string;
  meta?: Record<string, unknown>;
  warnings?: string[];
  error?: string;
};

type FileProgress = {
  name: string;
  size: number;
  progress: number; // 0-100
  status: "queued" | "uploading" | "done" | "error";
  result?: UploadResult;
  error?: string;
};

// ---- Component ----
export default function ResumeDashboard() {
  const [files, setFiles] = useState<File[]>([]);
  const [queue, setQueue] = useState<FileProgress[]>([]);
  const [activeView, setActiveView] = useState<"chat" | "uploads">("chat");
  const [serverURL, setServerURL] = useState<string>("/api/upload");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Drag-n-drop handlers
  const onDrop = useCallback((ev: React.DragEvent) => {
    ev.preventDefault();
    const dropped = Array.from(ev.dataTransfer.files || []);
    if (dropped.length) addFiles(dropped);
  }, []);

  const addFiles = (newFiles: File[]) => {
    const allowed = [".pdf", ".docx", ".txt"];
    const filtered = newFiles.filter((f) =>
      allowed.some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    setFiles((prev) => [...prev, ...filtered]);
    setQueue((prev) => [
      ...prev,
      ...filtered.map((f) => ({
        name: f.name,
        size: f.size,
        progress: 0,
        status: "queued" as const,
      })),
    ]);
    setActiveView("uploads");
  };

  const triggerFilePick = () => inputRef.current?.click();

  // Upload runner
  useEffect(() => {
    const run = async () => {
      const next = queue.findIndex((q) => q.status === "queued");
      if (next === -1) return;

      setQueue((prev) => {
        const copy = [...prev];
        copy[next] = { ...copy[next], status: "uploading", progress: 5 };
        return copy;
      });

      const file = files.find((f) => f.name === queue[next].name);
      if (!file) return;

      try {
        const body = new FormData();
        body.append("file", file);

        const res = await fetch(serverURL, {
          method: "POST",
          body,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // server expected to return { text: string, meta?: object, warnings?: string[] }
        const data: UploadResult = await res.json();

        setQueue((prev) => {
          const copy = [...prev];
          copy[next] = { ...copy[next], status: "done", progress: 100, result: data };
          return copy;
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setQueue((prev) => {
          const copy = [...prev];
          copy[next] = { ...copy[next], status: "error", progress: 100, error: message };
          return copy;
        });
      }
    };

    // Kick one upload at a time
    const uploading = queue.some((q) => q.status === "uploading");
    const queued = queue.some((q) => q.status === "queued");
    if (!uploading && queued) void run();
  }, [queue, files, serverURL]);

  return (
    <div className="h-screen w-full grid grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <aside className="border-r bg-white/70 dark:bg-zinc-900/60 backdrop-blur p-4 flex flex-col gap-4">
        <div className="text-xl font-semibold">Rovari Console</div>
        <button
          onClick={() => setActiveView("chat")}
          className={`text-left px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
            activeView === "chat" ? "bg-zinc-100 dark:bg-zinc-800" : ""
          }`}
        >
          Conversation
        </button>
        <button
          onClick={() => setActiveView("uploads")}
          className={`text-left px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
            activeView === "uploads" ? "bg-zinc-100 dark:bg-zinc-800" : ""
          }`}
        >
          Resume Uploads
        </button>

        <div className="mt-auto space-y-2">
          <label className="text-xs text-zinc-500">Upload API route (override if needed)</label>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={serverURL}
            onChange={(e) => setServerURL(e.target.value)}
          />
          <p className="text-[11px] text-zinc-500">Uploads are processed by the built-in <code>/api/upload</code> route on Vercel.</p>
        </div>
      </aside>

      {/* Main */}
      <main className="relative">
        <div className="absolute inset-0 overflow-y-auto">
          {activeView === "chat" ? (
            <ChatLikeArea onPickFiles={triggerFilePick} onDrop={onDrop} addFiles={addFiles} inputRef={inputRef} />
          ) : (
            <UploadsPanel queue={queue} />
          )}
        </div>
      </main>
    </div>
  );
}

// ---- Chat-like area with dropzone ----
function ChatLikeArea({
  onPickFiles,
  onDrop,
  addFiles,
  inputRef,
}: {
  onPickFiles: () => void;
  onDrop: (ev: React.DragEvent) => void;
  addFiles: (files: File[]) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [message, setMessage] = useState("");

  const onPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (const item of items) {
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) addFiles(files);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 z-10 border-b bg-white/70 dark:bg-zinc-900/60 backdrop-blur px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="text-lg font-medium">Workspace</div>
          <div className="ml-auto text-xs text-zinc-500">Drop resumes anywhere ↓</div>
        </div>
      </header>

      <div
        className="flex-1 p-6 overflow-y-auto"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onPaste={onPaste}
      >
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border p-6 text-sm text-zinc-600 dark:text-zinc-300">
            This is your &quot;amazing space&quot;. Use it like a ChatGPT canvas. Start a chat, or drop/upload resumes (PDF, DOCX or
            TXT) to parse them directly in the cloud.
          </div>
        </div>
      </div>

      <footer className="border-t bg-white/70 dark:bg-zinc-900/60 backdrop-blur px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2">
            <button
              onClick={onPickFiles}
              className="rounded-2xl border px-3 py-2 text-sm hover:bg-zinc-50"
              title="Attach resumes"
            >
              + Upload
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              multiple
              onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
              accept=".pdf,.docx,.txt"
            />

            <textarea
              rows={1}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 resize-none rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-1"
            />
            <button className="rounded-2xl bg-black text-white px-4 py-2 text-sm">
              Send
            </button>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            You can also paste screenshots/PDFs directly here.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ---- Uploads panel ----
function UploadsPanel({ queue }: { queue: FileProgress[] }) {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <h2 className="text-xl font-semibold">Resume Uploads</h2>
        {!queue.length && (
          <p className="text-sm text-zinc-500">No files uploaded yet. Use the Upload button or drag & drop.</p>
        )}
        <ul className="space-y-4">
          {queue.map((item, idx) => (
            <li key={idx} className="rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                <div className="font-medium">{item.name}</div>
                <div className="ml-auto text-xs text-zinc-500">
                  {(item.size / 1024).toFixed(1)} KB · {item.status}
                </div>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={`h-full ${item.status === "error" ? "bg-red-500" : "bg-black"}`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              {item.error && <p className="mt-2 text-sm text-red-600">{item.error}</p>}
              {item.result?.warnings?.length ? (
                <ul className="mt-2 list-disc pl-5 text-xs text-amber-600">
                  {item.result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              ) : null}
              {item.result?.text && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-zinc-700">Preview extracted text</summary>
                   <pre
    className="
      mt-2 max-h-64 overflow-auto rounded-xl
      bg-white dark:bg-neutral-900        /* higher-contrast bg */
      p-3 text-xs whitespace-pre-wrap
      text-black dark:text-white          /* <-- force text color */
      not-prose                           /* avoids Typography plugin grays */
    "
  >{item.result.text}</pre>
                </details>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
