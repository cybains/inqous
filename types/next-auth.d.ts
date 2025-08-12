declare module "next-auth" {
  export function getServerSession(...args: any[]): any;
  export type NextAuthOptions = any;
  const NextAuth: any;
  export default NextAuth;
}

declare module "next-auth/react" {
  export function signIn(...args: any[]): any;
  export function useSession(...args: any[]): any;
}

declare module "next-auth/providers/google" {
  const GoogleProvider: any;
  export default GoogleProvider;
}

declare module "next-auth/middleware" {
  export function withAuth(...args: any[]): any;
}

declare module "next-auth/jwt" {
  export function getToken(...args: any[]): any;
}
