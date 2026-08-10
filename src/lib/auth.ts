import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";

import { db } from "@/db/client";
import { account, session, user, verificationToken } from "@/db/schema/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: user,
    accountsTable: account,
    sessionsTable: session,
    verificationTokensTable: verificationToken,
  }),
  providers: [
    Nodemailer({
      // Falls back to an unreachable local address so the app still boots
      // without SMTP configured; sending a magic link fails until real
      // EMAIL_SERVER/EMAIL_FROM values are set in .env.local.
      server: process.env.EMAIL_SERVER || "smtp://localhost:1025",
      from: process.env.EMAIL_FROM || "CENTOR CRM <no-reply@example.com>",
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    // Enforces the soft-delete convention: deactivating a user (is_active =
    // false) revokes access without deleting their row or history.
    async signIn({ user: signingInUser }) {
      return signingInUser.isActive !== false;
    },
    async session({ session, user: sessionUser }) {
      session.user.role = sessionUser.role;
      session.user.isActive = sessionUser.isActive;
      return session;
    },
  },
});
