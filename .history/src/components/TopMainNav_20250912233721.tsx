"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type MainKey = "cv" | "opportunities" | "growth" | "mobility" | "path" | "settings";

const items: Array<{ key: MainKey; label: string; href: string }> = [
  { key: "cv",            label: "CV & Documents", href: "/dashboard/docs" },           // maps to your existing /docs
  { key: "opportunities", label: "Opportunities",  href: "/dashboard/jobs" },           // maps to your existing /jobs
  { key: "growth",        label: "Growth",         href: "/dashboard/growth" },         // placeholder for now
  { key: "mobility",      label: "Mobility",       href: "/dashboard/mobility" },       // placeholder
  { key: "path",          label: "Path",           href: "/dashboard/path" },           // placeholder
  { key: "settings",      label: "Settings",       href: "/dashboard/settings" },       // placeholder
];

function inferActive(pathname: string): MainKey | null {
  if (pathname.startsWith("/dashboard/docs") || pathname.startsWith("/dashboard/cv")) return "cv";
  if (pathname.startsWith("/dashboard/jobs")) return "opportunities";
  if (pathname.startsWith("/dashboard/growth")) return "growth";
  if (pathname.startsWith("/dashboard/mobility")) return "mobility";
  if (pathname.startsWith("/dashboard/path")) return "path";
  if (pathname.startsWith("/dashboard/settings")) return "settings";
  return null;
}

export default function TopMainNav() {
  const pathname = usePathname();
  const active = inferActive(pathname || "");

  return (
    <nav className="hidden md:flex items-center gap-1 rounded-full border px-2 py-1 bg-white">
      {items.map(({ key, label, href }) => {
        const isActive = active === key;
        return (
          <Link
            key={key}
            href={href}
            className={`rounded-full px-3 py-1.5 text-sm transition
              ${isActive ? "bg-gray-900 text-white" : "text-gray-800 hover:bg-gray-100"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
