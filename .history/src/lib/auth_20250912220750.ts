// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { syncUserToMongo } from "@/lib/syncUserToMongo";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Persist uid once
      if (user?.id) (token as any).uid = user.id;

      // Load role from DB on first issue OR if missing on token
      if (!(token as any).role && (token as any).uid) {
        const dbUser = await prisma.user.findUnique({
          where: { id: (token as any).uid },
          select: { role: true },
        });
        (token as any).role = dbUser?.role ?? "INDIVIDUAL";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).uid as string;
        (session.user as any).role = (token as any).role ?? "INDIVIDUAL";
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user?.id) {
        // Ensure default role set in DB if missing (defensive)
        await prisma.user.update({
          where: { id: user.id },
          data: { role: (user as any).role ?? undefined }, // keep if adapter set, else leave default
        }).catch(() => {});
        await syncUserToMongo(user.id).catch(console.error);
      }
    },
    async linkAccount({ user }) { if (user?.id) await syncUserToMongo(user.id).catch(console.error); },
    async updateUser({ user }) { if (user?.id) await syncUserToMongo(user.id).catch(console.error); },
  },
};
