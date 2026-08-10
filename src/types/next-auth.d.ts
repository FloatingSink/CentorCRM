import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role: "admin" | "member" | "viewer";
      isActive: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: "admin" | "member" | "viewer";
    isActive: boolean;
  }
}
