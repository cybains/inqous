import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { getUserDb } from "@/lib/mongodb";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const db = await getUserDb();
      const users = db.collection("users");
      const existing = await users.findOne({ email: user.email });
      if (!existing) {
        await users.insertOne({
          email: user.email,
          name: user.name,
          image: user.image,
        });
      }
      return true;
    },
  },
};
