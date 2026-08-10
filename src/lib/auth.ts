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
    // Auth.js handles provider failures (e.g. SMTP send errors) as an
    // internal redirect, not a thrown error — signIn() never sees it, so it
    // can't be caught in the server action. Routing the error page back to
    // /sign-in (with ?error=...) is how the sign-in form actually learns
    // about it; see the error param handling in sign-in-form.tsx.
    error: "/sign-in",
  },
  callbacks: {
    // Enforces the soft-delete convention: deactivating a user (is_active =
    // false) revokes access without deleting their row or history.
    async signIn({ user: signingInUser }) {
      return signingInUser.isActive !== false;
    },
    async session({ session, user: sessionUser }) {
      // Built explicitly rather than spreading sessionUser: the adapter
      // passes the full user row (createdBy, createdAt, ...), and this
      // session object is served as-is from /api/auth/session.
      session.user = {
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        image: sessionUser.image,
        emailVerified: sessionUser.emailVerified,
        role: sessionUser.role,
        isActive: sessionUser.isActive,
      };
      return session;
    },
  },
});
