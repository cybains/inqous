// lib/roles.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireIndividual() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false as const, reason: "unauthenticated" };
  if (session.user.role !== "INDIVIDUAL" && session.user.role !== "ADMIN")
    return { ok: false as const, reason: "forbidden" };
  return { ok: true as const, session };
}

export async function requireEmployer() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false as const, reason: "unauthenticated" };
  if (session.user.role !== "EMPLOYER" && session.user.role !== "ADMIN")
    return { ok: false as const, reason: "forbidden" };
  return { ok: true as const, session };
}
