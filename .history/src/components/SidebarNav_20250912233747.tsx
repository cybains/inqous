"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

type SubItem = { label: string; href: string; disabled?: boolean };
type Section = { title: string; items: SubItem[] };

const SECTIONS: Record<string, Section> = {
  cv: {
    title: "CV & Documents",
    items: [
      { label: "Upload",           href: "/dashboard/docs" },      // your upload UI lives on dashboard/docs for now
      { label: "My Documents",     href: "/dashboard/docs" },
      { label: "Parsed Profile",   href: "/dashboard/docs", disabled: true },
      { label: "Candidate Card",   href: "/dashboard/docs", disabled: true },
      { label: "Verification Center", href: "/dashboard/docs", disabled: true },
      { label: "Version History",  href: "/dashboard/docs", disabled: true },
      { label: "Data & Permissions", href: "/dashboard/docs", disabled: true },
    ],
  },
  opportunities: {
    title: "Opportunities",
    items: [
      { label: "Discover",     href: "/dashboard/jobs" },
      { label: "Strong Matches", href: "/dashboard/jobs", disabled: true },
      { label: "Saved & Alerts", href: "/dashboard/jobs/saved" },
      { label: "Applications", href: "/dashboard/jobs", disabled: true },
      { label: "Interviews",   href: "/dashboard/jobs", disabled: true },
      { label: "Companies",    href: "/dashboard/jobs", disabled: true },
    ],
  },
  growth: {
    title: "Growth",
    items: [
      { label: "Skill Gaps",        href: "/dashboard/growth", disabled: true },
      { label: "Recommendations",   href: "/dashboard/growth", disabled: true },
      { label: "Practice & Portfolio", href: "/dashboard/growth", disabled: true },
      { label: "Assessments",       href: "/dashboard/growth", disabled: true },
    ],
  },
  mobility: {
    title: "Mobility",
    items: [
      { label: "Work Authorization",      href: "/dashboard/mobility", disabled: true },
      { label: "Visa & Relocation Wizard",href: "/dashboard/mobility", disabled: true },
      { label: "Remote Readiness",        href: "/dashboard/mobility", disabled: true },
      { label: "City Compare",            href: "/dashboard/mobility", disabled: true },
    ],
  },
  path: {
    title: "Path",
    items: [
      { label: "Targets",            href: "/dashboard/path", disabled: true },
      { label: "Trajectory",         href: "/dashboard/path", disabled: true },
      { label: "Milestones",         href: "/dashboard/path", disabled: true },
      { label: "Comp & Benefits Goals", href: "/dashboard/path", disabled: true },
    ],
  },
  settings: {
    title: "Settings & Support",
    items: [
      { label: "Notifications", href: "/dashboard/settings", disabled: true },
      { label: "Privacy & Data", href: "/dashboard/settings", disabled: true },
      { label: "Help",           href: "/dashboard/settings", disabled: true },
    ],
  },
};

function inferActive(pathname: string): keyof typeof SECTIONS | null {
  if (pathname.startsWith("/dashboard/docs") || pathname.startsWith("/dashboard/cv")) return "cv";
  if (pathname.startsWith("/dashboard/jobs")) return "opportunities";
  if (pathname.startsWith("/dashboard/growth")) return "growth";
  if (pathname.startsWith("/dashboard/mobility")) return "mobility";
  if (pathname.startsWith("/dashboard/path")) return "path";
  if (pathname.startsWith("/dashboard/settings")) return "settings";
  return null;
}

export default function SidebarNav() {
  const pathname = usePathname();
  const activeKey = inferActive(pathname || "");
  const section = activeKey ? SECTIONS[activeKey] : null;

  return (
    <nav className="space-y-3">
      {!section ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">
          Select a menu from the top bar.
        </div>
      ) : (
        <div className="rounded-xl border bg-white">
          <div className="px-4 py-3 font-medium text-gray-900">{section.title}</div>
          <div className="border-t">
            {section.items.map((it) => {
              const active = pathname === it.href;
              const classes = it.disabled
                ? "opacity-50 cursor-not-allowed"
                : active
                ? "bg-gray-100 text-gray-900"
                : "text-gray-700 hover:bg-gray-50";
              const content = (
                <div className={`flex items-center justify-between px-4 py-2 text-sm ${classes}`}>
                  <span>{it.label}</span>
                  {!it.disabled && <ChevronRight className="h-4 w-4 text-gray-500" />}
                </div>
              );
              return it.disabled ? (
                <div key={it.label}>{content}</div>
              ) : (
                <Link key={it.label} href={it.href}>{content}</Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
