// src/app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
      <p className="text-sm opacity-80">Hello, {session.user.name ?? session.user.email}!</p>

      {/* Your ResumeDashboard component would go here */}
      {/* <ResumeDashboard /> */}
    </main>
  );
}
