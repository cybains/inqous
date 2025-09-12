import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { syncUserToMongo } from "@/lib/syncUserToMongo";
import { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [ GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! }) ],
import { Role } from "@prisma/client";
// ...
callbacks: {
  async jwt({ token, user }) {
    if (user?.id) token.uid = user.id;
    if (!token.role && token.uid) {
      const dbUser = await prisma.user.findUnique({
        where: { id: token.uid as string },
        select: { role: true },
      });
      token.role = dbUser?.role ?? Role.INDIVIDUAL;
    }
    return token;
  },
  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.uid as string;
      session.user.role = (token.role as Role) ?? Role.INDIVIDUAL;
    }
    return session;
  },
},
