// src/components/TopMainNav.tsx
"use client";

import { usePathname } from "next/navigation";

type MainKey = "cv" | "opportunities" | "growth" | "mobility" | "path" | "settings";

export default function TopMainNav({
  onOpen,
}: {
  onOpen: (key: MainKey) => void;
}) {
  const pathname = usePathname();

  function inferActive(path: string): MainKey | null {
    if (path.startsWith("/dashboard/docs") || path.startsWith("/dashboard/cv")) return "cv";
    if (path.startsWith("/dashboard/jobs")) return "opportunities";
    if (path.startsWith("/dashboard/growth")) return "growth";
    if (path.startsWith("/dashboard/mobility")) return "mobility";
    if (path.startsWith("/dashboard/path")) return "path";
    if (path.startsWith("/dashboard/settings")) return "settings";
    return null;
  }

  const active = inferActive(pathname || "");

  const items: { key: MainKey; label: string }[] = [
    { key: "cv", label: "CV & Documents" },
    { key: "opportunities", label: "Opportunities" },
    { key: "growth", label: "Growth" },
    { key: "mobility", label: "Mobility" },
    { key: "path", label: "Path" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <nav className="hidden md:flex items-center gap-1 rounded-full border px-2 py-1 bg-white">
      {items.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onOpen(key)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              isActive ? "bg-gray-900 text-white" : "text-gray-800 hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
