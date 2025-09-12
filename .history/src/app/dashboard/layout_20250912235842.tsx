
// src/app/dashboard/layout.tsx
import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";

import { Compass } from "lucide-react";
import TopMainNav from "@/components/TopMainNav";
import SlideSubmenu from "@/components/SlideSubmenu";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/dashboard");

  return (
    <div className="min-h-dvh bg-gray-50">
      <HeaderShell
        userImage={session.user.image ?? null}
        userLabel={session.user.name ?? session.user.email ?? "You"}
      />
      <main className="mx-auto w-full max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}

/** Client header with minimal topbar and slide-in submenu */

import { useState, useCallback } from "react";

function HeaderShell({
  userImage,
  userLabel,
}: {
  userImage: string | null;
  userLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<"cv" | "opportunities" | "growth" | "mobility" | "path" | "settings" | null>(null);

  const handleOpen = useCallback((key: any) => {
    setSection(key);
    setOpen(true);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-6 py-3">
          {/* Left: Logo only */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900 text-white">
              <Compass className="h-5 w-5" />
            </div>
          </div>

          {/* Center: Top main menu */}
          <div className="flex justify-center">
            <TopMainNav onOpen={handleOpen} />
          </div>

          {/* Right: user + sign out */}
          <div className="flex items-center justify-end gap-3">
            <div className="flex items-center gap-2">
              {userImage ? (
                <Image src={userImage} alt={userLabel} width={28} height={28} className="rounded-full" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-gray-200" />
              )}
              <span className="text-sm text-gray-900">{userLabel}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Slide-in submenu */}
      <SlideSubmenu open={open} section={section} onClose={() => setOpen(false)} />
    </>
  );
}
