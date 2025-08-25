import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
      <p className="text-sm opacity-80">
        Hello, {session.user.name ?? session.user.email}!
      </p>

      {/* Your ResumeDashboard goes here */}
    </main>
  );
}
# Generate/apply prisma tables (if not yet)
npx prisma migrate dev --name init

# Start dev
npm run dev
