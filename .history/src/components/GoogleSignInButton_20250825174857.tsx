// src/components/GoogleSignInButton.tsx
"use client";

import { signIn } from "next-auth/react";

export default function GoogleSignInButton() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      className="rounded-md border px-4 py-2 hover:bg-gray-50"
    >
      Sign in with Google
    </button>
  );
}
