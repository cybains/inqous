import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import Link from "next/link";

export default async function Page() {
  const session = await getServerSession(authOptions);

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Welcome</h1>
      {session?.user ? (
        <div className="space-y-3">
          <p>
            Signed in as{" "}
            <strong>{session.user.email ?? session.user.name}</strong>
          </p>
          <Link href="/dashboard" className="underline">
            Go to dashboard →
          </Link>
        </div>
      ) : (
        <GoogleSignInButton />
      )}
    </main>
  );
}
