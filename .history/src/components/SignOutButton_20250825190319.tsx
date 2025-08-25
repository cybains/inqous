"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black/10"
      title="Sign out"
    >
      Sign out
    </button>
  );
}
