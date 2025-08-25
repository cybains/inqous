// Make sure this file is included by TS (default Next.js tsconfig does).
import { DefaultSession } from "next-auth";

// Add `id` to Session user
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// Add our custom field to the JWT
declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
  }
}
