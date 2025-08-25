import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import GoogleSignInButton from "../components/GoogleSignInButton";
import Link from "next/link";

export default async function Page() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-dvh grid place-items-center">
      <div className="mx-auto w-full max-w-xl rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Welcome</h1>

        <div className="mt-6 flex items-center gap-3">
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-white font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                Go to dashboard
              </Link>
              <Link
                href="/api/auth/signout"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                Sign out
              </Link>
            </>
          ) : (
            <GoogleSignInButton />
          )}
        </div>
      </div>
    </main>
  );
}
