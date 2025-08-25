// src/lib/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { syncUserToMongo } from "./syncUserToMongo";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // keep sessions in JWT; DB still stores Users/Accounts
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, app }) {
      // On first sign-in, attach the Prisma user id to the token
      if (user) token.uid = (user as any).id;
      return token;
    },
    async session({ session, token }) {
      if (token?.uid) {
        // expose prisma user id on session.user.id
        (session.user as any).id = token.uid as string;
      }
      return session;
    },
  },
  events: {
    // Mirror to Mongo on sign-in, account link, and user update
    async signIn({ user }) {
      if (user?.id) {
        try {
          await syncUserToMongo(user.id);
        } catch (e) {
          console.error("Mongo mirror (signIn) failed:", e);
        }
      }
    },
    async linkAccount({ user }) {
      if (user?.id) {
        try {
          await syncUserToMongo(user.id);
        } catch (e) {
          console.error("Mongo mirror (linkAccount) failed:", e);
        }
      }
    },
    async updateUser({ user }) {
      if (user?.id) {
        try {
          await syncUserToMongo(user.id);
        } catch (e) {
          console.error("Mongo mirror (updateUser) failed:", e);
        }
      }
    },
  },
});
