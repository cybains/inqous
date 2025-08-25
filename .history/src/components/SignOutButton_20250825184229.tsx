"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
      title="Sign out"
    >
      Sign out
    </button>
  );
}
