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
      if (user?.id) (token as any).uid = user.id;

      // Ensure role is present on the token (load from DB once)
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
      // Defensive: ensure the user row has a role (defaults via Prisma schema anyway)
      if (user?.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { /* role left as default unless you want to force-set */ },
        }).catch(() => {});
        await syncUserToMongo(user.id).catch(console.error);
      }
    },
    async linkAccount({ user }) { if (user?.id) await syncUserToMongo(user.id).catch(console.error); },
    async updateUser({ user }) { if (user?.id) await syncUserToMongo(user.id).catch(console.error); },
  },
};
