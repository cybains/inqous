import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { syncUserToMongo } from "@/lib/syncUserToMongo";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      // use AUTH_* since your .env uses those names
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On first sign-in, persist the Prisma user id to the token
      if (user?.id) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      // Expose Prisma user id to the client session
      if (session.user && token.uid) {
        session.user.id = token.uid;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user?.id) {
        try {
          await syncUserToMongo(user.id);
        } catch (err) {
          console.error("Mongo mirror (signIn) failed:", err);
        }
      }
    },
    async linkAccount({ user }) {
      if (user?.id) {
        try {
          await syncUserToMongo(user.id);
        } catch (err) {
          console.error("Mongo mirror (linkAccount) failed:", err);
        }
      }
    },
    async updateUser({ user }) {
      if (user?.id) {
        try {
          await syncUserToMongo(user.id);
        } catch (err) {
          console.error("Mongo mirror (updateUser) failed:", err);
        }
      }
    },
  },
});
