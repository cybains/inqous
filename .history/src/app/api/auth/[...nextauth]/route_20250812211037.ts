// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// TEMP DEBUG — add this line once to verify the env really loads:
console.log("AUTH_GOOGLE_ID prefix:", process.env.AUTH_GOOGLE_ID?.slice(0, 12));

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,       // <-- match .env.local
      clientSecret: process.env.AUTH_GOOGLE_SECRET!, // <-- match .env.local
    }),
  ],
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
