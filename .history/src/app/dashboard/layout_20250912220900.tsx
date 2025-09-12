// app/dashboard/layout.tsx  (your existing file path)
import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import SidebarNav from "../../components/SidebarNav";
import SignOutButton from "../../components/SignOutButton";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/dashboard");

  const role = (session.user as any).role ?? "INDIVIDUAL";

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r bg-white p-6 md:block">
          <div className="mb-8 flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-black/90"></div>
            <div className="text-sm font-medium text-gray-900">Compass</div>
          </div>
          <SidebarNav />
        </aside>

        {/* Main column */}
        <div className="flex min-h-dvh flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-10 border-b bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
              <div className="text-sm text-gray-800">{new Date().toLocaleDateString()}</div>
              <div className="flex items-center gap-3">
                {/* Glowing CV button */}
                <Link
                  href="/dashboard/cv/upload"
                  className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 animate-pulse"
                  title="Upload your CV"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16l4-4h10a2 2 0 0 0 2-2V6l-6-4z"/></svg>
                  <span>CV</span>
                </Link>

                <div className="flex items-center gap-2">
                  {session.user.image ? (
                    <Image src={session.user.image} alt={session.user.name ?? "User"} width={28} height={28} className="rounded-full" />
                  ) : (<div className="h-7 w-7 rounded-full bg-gray-200" />)}
                  <span className="text-sm text-gray-900">
                    {session.user.name ?? session.user.email} • <span className="uppercase">{role}</span>
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
