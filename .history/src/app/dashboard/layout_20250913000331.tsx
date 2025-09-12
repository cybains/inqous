import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import HeaderShell from "@/components/HeaderShell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/dashboard");

  return (
    <div className="min-h-dvh bg-gray-50">
      <HeaderShell
        userImage={session.user.image ?? null}
        userLabel={session.user.name ?? session.user.email ?? "You"}
      />
      <main className="mx-auto w-full max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
