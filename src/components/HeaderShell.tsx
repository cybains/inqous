"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { Compass } from "lucide-react";
import TopMainNav from "@/components/TopMainNav";
import SlideSubmenu from "@/components/SlideSubmenu";
import SignOutButton from "@/components/SignOutButton";

type SectionKey =
  | "cv"
  | "opportunities"
  | "growth"
  | "mobility"
  | "path"
  | "settings";

export default function HeaderShell({
  userImage,
  userLabel,
}: {
  userImage: string | null;
  userLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<SectionKey | null>(null);

  const handleOpen = useCallback((key: SectionKey) => {
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

          {/* Center: Main menu */}
          <div className="flex justify-center">
            <TopMainNav onOpen={handleOpen} />
          </div>

          {/* Right: user + sign out */}
          <div className="flex items-center justify-end gap-3">
            <div className="flex items-center gap-2">
              {userImage ? (
                <Image
                  src={userImage}
                  alt={userLabel}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
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
