"use client";

import { signIn } from "next-auth/react";

export default function GoogleSignInButton() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-white font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black/20"
    >
      Sign in with Google
    </button>
  );
}
