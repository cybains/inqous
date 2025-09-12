// src/components/SlideSubmenu.tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { X, ChevronRight } from "lucide-react";

type MainKey = "cv" | "opportunities" | "growth" | "mobility" | "path" | "settings";

const MENUS: Record<MainKey, { title: string; items: { label: string; href: string; disabled?: boolean }[] }> = {
  cv: {
    title: "CV & Documents",
    items: [
      { label: "Upload", href: "/dashboard/docs" },
      { label: "My Documents", href: "/dashboard/docs" },
      { label: "Parsed Profile", href: "/dashboard/docs", disabled: true },
      { label: "Candidate Card", href: "/dashboard/docs", disabled: true },
      { label: "Verification Center", href: "/dashboard/docs", disabled: true },
      { label: "Version History", href: "/dashboard/docs", disabled: true },
      { label: "Data & Permissions", href: "/dashboard/docs", disabled: true },
    ],
  },
  opportunities: {
    title: "Opportunities",
    items: [
      { label: "Discover", href: "/dashboard/jobs" },
      { label: "Strong Matches", href: "/dashboard/jobs", disabled: true },
      { label: "Saved & Alerts", href: "/dashboard/jobs/saved" },
      { label: "Applications", href: "/dashboard/jobs", disabled: true },
      { label: "Interviews", href: "/dashboard/jobs", disabled: true },
      { label: "Companies", href: "/dashboard/jobs", disabled: true },
    ],
  },
  growth: {
    title: "Growth",
    items: [
      { label: "Skill Gaps", href: "/dashboard/growth", disabled: true },
      { label: "Recommendations", href: "/dashboard/growth", disabled: true },
      { label: "Practice & Portfolio", href: "/dashboard/growth", disabled: true },
      { label: "Assessments", href: "/dashboard/growth", disabled: true },
    ],
  },
  mobility: {
    title: "Mobility",
    items: [
      { label: "Work Authorization", href: "/dashboard/mobility", disabled: true },
      { label: "Visa & Relocation Wizard", href: "/dashboard/mobility", disabled: true },
      { label: "Remote Readiness", href: "/dashboard/mobility", disabled: true },
      { label: "City Compare", href: "/dashboard/mobility", disabled: true },
    ],
  },
  path: {
    title: "Path",
    items: [
      { label: "Targets", href: "/dashboard/path", disabled: true },
      { label: "Trajectory", href: "/dashboard/path", disabled: true },
      { label: "Milestones", href: "/dashboard/path", disabled: true },
      { label: "Comp & Benefits Goals", href: "/dashboard/path", disabled: true },
    ],
  },
  settings: {
    title: "Settings & Support",
    items: [
      { label: "Notifications", href: "/dashboard/settings", disabled: true },
      { label: "Privacy & Data", href: "/dashboard/settings", disabled: true },
      { label: "Help", href: "/dashboard/settings", disabled: true },
    ],
  },
};

export default function SlideSubmenu({
  open,
  section,
  onClose,
}: {
  open: boolean;
  section: MainKey | null;
  onClose: () => void;
}) {
  // close on Esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const data = section ? MENUS[section] : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      {/* Panel */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-72 transform bg-white shadow-xl transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm font-semibold text-gray-900">{data?.title ?? "Menu"}</div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-700" />
          </button>
        </div>

        <nav className="divide-y">
          {data?.items.map((item) => {
            const row = (
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className={item.disabled ? "text-gray-400" : "text-gray-800"}>{item.label}</span>
                {!item.disabled && <ChevronRight className="h-4 w-4 text-gray-500" />}
              </div>
            );
            return item.disabled ? (
              <div key={item.label} className="opacity-60 cursor-not-allowed">
                {row}
              </div>
            ) : (
              <Link key={item.label} href={item.href} onClick={onClose} className="block hover:bg-gray-50">
                {row}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
