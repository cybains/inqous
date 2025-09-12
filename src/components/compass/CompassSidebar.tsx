// components/compass/CompassSidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight, FileUp, FileText, BadgeCheck, History, Lock, Search, Stars, Bookmark, Send, Calendar, Building2, Target, Route, Flag, Banknote, Map, Globe2, Settings, Bell, ShieldQuestion, HelpCircle, Clock3 } from "lucide-react";

function Section({ title, icon: Icon, children }: any) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border bg-white">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <Icon className="h-4 w-4 text-gray-700" />
        <span className="font-medium text-gray-900">{title}</span>
        <span className="ml-auto text-gray-500">{open ? <ChevronDown /> : <ChevronRight />}</span>
      </button>
      {open && <div className="border-t">{children}</div>}
    </div>
  );
}
function Item({ href, children }: any) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link href={href} className={`block px-4 py-2 text-sm ${active ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-50"}`}>
      {children}
    </Link>
  );
}

export default function CompassSidebar() {
  return (
    <aside className="space-y-3">
      {/* 1) CV & Documents */}
      <Section title="CV & Documents" icon={FileText}>
        <Item href="/dashboard/cv/upload"><FileUp className="mr-2 inline h-4 w-4" />Upload</Item>
        <Item href="/dashboard/cv/documents"><FileText className="mr-2 inline h-4 w-4" />My Documents</Item>
        <Item href="/dashboard/cv/profile"><BadgeCheck className="mr-2 inline h-4 w-4" />Parsed Profile</Item>
        <Item href="/dashboard/cv/card"><BadgeCheck className="mr-2 inline h-4 w-4" />Candidate Card</Item>
        <Item href="/dashboard/cv/verification"><ShieldQuestion className="mr-2 inline h-4 w-4" />Verification Center</Item>
        <Item href="/dashboard/cv/history"><History className="mr-2 inline h-4 w-4" />Version History</Item>
        <Item href="/dashboard/cv/permissions"><Lock className="mr-2 inline h-4 w-4" />Data & Permissions</Item>
      </Section>

      {/* 2) Opportunities */}
      <Section title="Opportunities" icon={Search}>
        <Item href="/dashboard/opportunities/discover"><Search className="mr-2 inline h-4 w-4" />Discover</Item>
        <Item href="/dashboard/opportunities/matches"><Stars className="mr-2 inline h-4 w-4" />Strong Matches</Item>
        <Item href="/dashboard/opportunities/saved"><Bookmark className="mr-2 inline h-4 w-4" />Saved & Alerts</Item>
        <Item href="/dashboard/opportunities/applications"><Send className="mr-2 inline h-4 w-4" />Applications</Item>
        <Item href="/dashboard/opportunities/interviews"><Calendar className="mr-2 inline h-4 w-4" />Interviews</Item>
        <Item href="/dashboard/opportunities/companies"><Building2 className="mr-2 inline h-4 w-4" />Companies</Item>
      </Section>

      {/* 3) Growth */}
      <Section title="Growth" icon={Stars}>
        <Item href="/dashboard/growth/gaps"><Target className="mr-2 inline h-4 w-4" />Skill Gaps</Item>
        <Item href="/dashboard/growth/recommendations"><Route className="mr-2 inline h-4 w-4" />Recommendations</Item>
        <Item href="/dashboard/growth/portfolio"><Flag className="mr-2 inline h-4 w-4" />Practice & Portfolio</Item>
        <Item href="/dashboard/growth/assessments"><BadgeCheck className="mr-2 inline h-4 w-4" />Assessments</Item>
      </Section>

      {/* 4) Mobility */}
      <Section title="Mobility" icon={Globe2}>
        <Item href="/dashboard/mobility/auth"><BadgeCheck className="mr-2 inline h-4 w-4" />Work Authorization</Item>
        <Item href="/dashboard/mobility/wizard"><Map className="mr-2 inline h-4 w-4" />Visa & Relocation Wizard</Item>
        <Item href="/dashboard/mobility/remote"><Clock3 className="mr-2 inline h-4 w-4" />Remote Readiness</Item>
        <Item href="/dashboard/mobility/cities"><Building2 className="mr-2 inline h-4 w-4" />City Compare</Item>
      </Section>

      {/* 5) Path */}
      <Section title="Path" icon={Route}>
        <Item href="/dashboard/path/targets"><Target className="mr-2 inline h-4 w-4" />Targets</Item>
        <Item href="/dashboard/path/trajectory"><Route className="mr-2 inline h-4 w-4" />Trajectory</Item>
        <Item href="/dashboard/path/milestones"><Flag className="mr-2 inline h-4 w-4" />Milestones</Item>
        <Item href="/dashboard/path/comp"><Banknote className="mr-2 inline h-4 w-4" />Comp & Benefits Goals</Item>
      </Section>

      {/* 6) Settings */}
      <Section title="Settings & Support" icon={Settings}>
        <Item href="/dashboard/settings/account"><Settings className="mr-2 inline h-4 w-4" />Account & Security</Item>
        <Item href="/dashboard/settings/notifications"><Bell className="mr-2 inline h-4 w-4" />Notifications</Item>
        <Item href="/dashboard/settings/privacy"><Lock className="mr-2 inline h-4 w-4" />Privacy & Data</Item>
        <Item href="/dashboard/settings/help"><HelpCircle className="mr-2 inline h-4 w-4" />Help</Item>
      </Section>
    </aside>
  );
}
