// lib/roles.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireIndividual() {
  const session = await getServerSession(authOptions);
  return !!session?.user && (session.user.role === "INDIVIDUAL" || session.user.role === "ADMIN");
}

export async function requireEmployer() {
  const session = await getServerSession(authOptions);
  return !!session?.user && (session.user.role === "EMPLOYER" || session.user.role === "ADMIN");
}
