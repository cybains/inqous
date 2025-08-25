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
        <p className="mt-2 text-sm text-gray-800">
          Sign in to upload resumes and manage jobs.
        </p>

        <div className="mt-6">
          {session?.user ? (
            <div className="space-y-4">
              <p className="text-gray-900">
                Signed in as{" "}
                <strong>{session.user.email ?? session.user.name}</strong>
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800"
              >
                Go to dashboard →
              </Link>
            </div>
          ) : (
            <GoogleSignInButton />
          )}
        </div>
      </div>
    </main>
  );
}
