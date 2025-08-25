"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function SidebarNav() {
  const pathname = usePathname();
  const [hasDocs, setHasDocs] = useState(false);

  useEffect(() => {
    fetch("/api/docs/has")
      .then((r) => r.json())
      .then((d) => setHasDocs(!!d?.hasDocs))
      .catch(() => {});
  }, []);

  const items = [
    { href: "/dashboard", label: "Overview", emoji: "🏠" },
    { href: "/dashboard/jobs", label: "Jobs", emoji: "💼" },
    ...(hasDocs ? [{ href: "/dashboard/docs", label: "Documents", emoji: "📄" }] : []),
  ];

  return (
    <nav className="space-y-1">
      {items.map((it) => {
        const active = pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            className={[
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
              active ? "bg-gray-900 text-white" : "text-gray-900 hover:bg-gray-100",
            ].join(" ")}
          >
            <span className="text-base">{it.emoji}</span>
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
