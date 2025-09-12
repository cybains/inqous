// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role?: "INDIVIDUAL" | "EMPLOYER" | "ADMIN";
  }
  interface Session {
    user: {
      id: string;
      role?: "INDIVIDUAL" | "EMPLOYER" | "ADMIN";
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
