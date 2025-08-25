import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import SidebarNav from "@/components/SidebarNav";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/dashboard");

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r bg-white/80 p-6 backdrop-blur md:block">
          <div className="mb-8 flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-black/90"></div>
            <div className="text-sm font-medium">Rovari Console</div>
          </div>
          <SidebarNav />
        </aside>

        {/* Main column */}
        <div className="flex min-h-dvh flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString()}
              </div>
              <div className="flex items-center gap-3">
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
                  <span className="text-sm">
                    {session.user.name ?? session.user.email}
                  </span>
                </div>
                <SignOutButton />
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
