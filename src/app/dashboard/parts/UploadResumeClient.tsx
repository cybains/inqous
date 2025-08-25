"use client";

import { useRef, useState } from "react";

export default function UploadResumeClient() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<"idle"|"uploading"|"done"|"error">("idle");
  const [msg, setMsg] = useState<string>("");

  function pickFile() {
    inputRef.current?.click();
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setStatus("uploading");
    setMsg("");

    const fd = new FormData();
    fd.append("file", f, f.name);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setStatus("error");
        setMsg(data?.error || "Upload failed");
      } else {
        setStatus("done");
        setMsg("Uploaded! Check Documents.");
      }
    } catch (err: any) {
      setStatus("error");
      setMsg(err?.message || "Upload failed");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.rtf,.txt,.png,.jpg,.jpeg"
        className="hidden"
        onChange={onPick}
      />
      <button
        onClick={pickFile}
        className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800"
      >
        Upload resume
      </button>
      {status === "uploading" && <span className="text-sm text-gray-700">Uploading…</span>}
      {status === "done" && <span className="text-sm text-green-700">{msg}</span>}
      {status === "error" && <span className="text-sm text-red-700">{msg}</span>}
    </div>
  );
}
