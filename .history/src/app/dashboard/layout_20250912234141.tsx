// src/app/dashboard/layout.tsx
import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import SidebarNav from "@/components/SidebarNav";
import SignOutButton from "@/components/SignOutButton";
import TopMainNav from "@/components/TopMainNav";
import { Compass } from "lucide-react";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/dashboard");

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="mx-auto flex max-w-7xl">
        {/* Left panel: shows ONLY the active submenu; otherwise a small placeholder */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r bg-white p-6 md:block">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900 text-white">
              <Compass className="h-5 w-5" />
            </div>
            {/* Removed "Compass" label per request */}
          </div>
          <SidebarNav />
        </aside>

        {/* Main column */}
        <div className="flex min-h-dvh flex-1 flex-col">
          {/* Top bar with main menu in the center */}
          <header className="sticky top-0 z-10 border-b bg-white">
            <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-6 py-3">
              {/* Left: Logo only (small) */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900 text-white">
                  <Compass className="h-5 w-5" />
                </div>
              </div>

              {/* Center: Main menu (CV & Documents, Opportunities, ...) */}
              <div className="flex justify-center">
                <TopMainNav />
              </div>

              {/* Right: CV button + user + sign out */}
              <div className="flex items-center justify-end gap-3">
                <Link
                  href="/dashboard/docs"
                  className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                  title="Upload your CV"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16l4-4h10a2 2 0 0 0 2-2V6l-6-4z" />
                  </svg>
                  <span>CV</span>
                </Link>

                <div className="flex items-center gap-2">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name ?? "User"}
                      width={28}
                      height={28}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-gray-200" />
                  )}
                  <span className="text-sm text-gray-900">
                    {session.user.name ?? session.user.email}
                    {/* role intentionally omitted */}
                  </span>
                </div>
                <SignOutButton />
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
