// components/compass/CompassTopbar.tsx
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FileUp, User } from "lucide-react";

export default function CompassTopbar({ userName, role }: { userName: string; role: string }) {
  const [glow, setGlow] = useState(false);

  // Simple first-minute nudge: glow after 45s if user is active
  useEffect(() => {
    const id = setTimeout(() => setGlow(true), 45000);
    const cancelGlow = () => setGlow(false);
    window.addEventListener("click", cancelGlow, { once: true });
    return () => {
      clearTimeout(id);
      window.removeEventListener("click", cancelGlow);
    };
  }, []);

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">inqous</Link>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/cv/upload"
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium ${glow ? "animate-pulse bg-teal-600 text-white shadow-lg" : "bg-gray-900 text-white hover:bg-gray-800"}`}
            title="Upload your CV"
          >
            <FileUp className="h-4 w-4" />
            <span>CV</span>
          </Link>
          <div className="rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-800">
            <User className="mr-1 inline h-4 w-4" />
            {userName} • <span className="uppercase">{role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
