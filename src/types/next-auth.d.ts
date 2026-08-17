import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "member";
      isActive: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: "admin" | "member";
    isActive: boolean;
  }
}
