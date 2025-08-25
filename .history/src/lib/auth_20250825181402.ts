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
      // If you kept AUTH_GOOGLE_* instead, just read those here.
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) (token as any).uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && (token as any).uid) {
        (session.user as any).id = (token as any).uid as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) { if (user?.id) await syncUserToMongo(user.id).catch(console.error); },
    async linkAccount({ user }) { if (user?.id) await syncUserToMongo(user.id).catch(console.error); },
    async updateUser({ user }) { if (user?.id) await syncUserToMongo(user.id).catch(console.error); },
  },
};
