// components/compass/ResumeUploadDialog.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { X, Upload } from "lucide-react";

type Step = "idle" | "uploading" | "parsing" | "enriching" | "done" | "error";

export default function ResumeUploadDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [fullName, setFullName] = useState("");
  const [latest, setLatest] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setStep("idle");
      setFile(null);
    }
  }, [open]);

  async function handleUpload() {
    if (!file) return;
    setStep("uploading");
    const form = new FormData();
    form.append("file", file);
    form.append("fullName", fullName);
    form.append("isLatest", String(latest));

    try {
      const res = await fetch("/api/resume/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      setStep("parsing");
      // Simulate parse + enrich (replace with your real pipeline webhook)
      setTimeout(() => setStep("enriching"), 700);
      setTimeout(() => setStep("done"), 1400);
    } catch (e) {
      console.error(e);
      setStep("error");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
      >
        <Upload className="h-4 w-4" />
        Upload resume
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Upload your CV</h3>
              <button onClick={() => setOpen(false)}><X /></button>
            </div>

            <div className="mt-4 space-y-4">
              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-gray-400"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) setFile(f);
                }}
              >
                {file ? (
                  <>
                    <p className="text-sm text-gray-800">Selected: <strong>{file.name}</strong></p>
                    <p className="text-xs text-gray-500">Size: {(file.size/1024/1024).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <Upload className="mb-2 h-6 w-6 text-gray-700" />
                    <p className="text-sm text-gray-800">Drop PDF/DOCX here or click to browse</p>
                    <p className="text-xs text-gray-500">Max 5 MB</p>
                  </>
                )}
                <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0]; if (f) setFile(f);
                }} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-gray-700">Your full name</label>
                  <input value={fullName} onChange={(e)=>setFullName(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Jane Doe" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={latest} onChange={(e)=>setLatest(e.target.checked)} />
                    <span className="text-sm text-gray-700">This is my latest CV</span>
                  </label>
                </div>
              </div>

              <Stepper step={step} />

              <div className="flex justify-end gap-2">
                <button onClick={()=>setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Cancel</button>
                <button
                  onClick={handleUpload}
                  disabled={!file || !fullName || step !== "idle"}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Stepper({ step }: { step: string }) {
  const order = ["uploading","parsing","enriching","done"];
  const idx = order.indexOf(step);
  return (
    <div className="mt-2 grid grid-cols-4 items-center gap-2">
      {["Upload","Parse","Enrich","Ready"].map((label, i)=>(
        <div key={label} className={`rounded-lg px-3 py-2 text-center text-xs ${i<idx? "bg-green-100 text-green-800" : i===idx? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`}>{label}</div>
      ))}
      {step==="error" && <p className="col-span-4 text-sm text-red-600">Upload failed. Try again.</p>}
    </div>
  );
}
