"use client";

import { signIn } from "next-auth/react";

export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen">
      <button
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Sign in with Google
      </button>
    </main>
  );
}
