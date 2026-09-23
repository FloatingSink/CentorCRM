import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import { NextRequest } from "next/server";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

import { db } from "@/db/client";
import { account, session, user, verificationToken } from "@/db/schema/auth";
import { recordLogin } from "@/server/login-event";

const nextAuth = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: user,
    accountsTable: account,
    sessionsTable: session,
    verificationTokensTable: verificationToken,
  }),
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      // Restricted to CENTOR's own Entra tenant (a specific
      // https://login.microsoftonline.com/<tenant-id>/v2.0/ URL) rather than
      // the default "common" endpoint — confirmed with Jia Long. Relaxing
      // this to any Microsoft account later is a one-value env var change,
      // not a code change.
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/sign-in",
    // Auth.js handles provider failures as an internal redirect, not a
    // thrown error — signIn() never sees it, so it can't be caught in the
    // server action. Routing the error page back to /sign-in (with
    // ?error=...) is how the sign-in form actually learns about it; see the
    // error param handling in sign-in-form.tsx.
    error: "/sign-in",
  },
  callbacks: {
    // No self-service signup (confirmed with Jia Long) — a Microsoft account
    // must already have a matching `user` row (admin-created) before it can
    // sign in, same as the old magic-link flow only ever authenticated
    // existing rows. Verified this is safe to enforce here, not just
    // convenient: traced @auth/core's OAuth callback and confirmed this
    // signIn callback runs *before* the adapter ever creates a user row for
    // a new account — rejecting here means no row is ever written, not an
    // orphaned one cleaned up after the fact.
    //
    // Looked up fresh from the DB rather than trusting the callback's own
    // `user` param: for a first-time sign-in that object is the raw
    // Microsoft profile shape, not a `user` table row, so `isActive` isn't
    // reliably present on it.
    async signIn({ user: signingInUser }) {
      if (!signingInUser.email) return false;
      const [existing] = await db
        .select()
        .from(user)
        .where(eq(user.email, signingInUser.email));
      if (!existing) return false;
      return existing.isActive !== false;
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
  events: {
    // Fires after handleLoginOrRegister resolves the real DB user (verified
    // against the installed @auth/core source during the SSO work) — a
    // history of every sign-in, not just a single "last login" timestamp.
    async signIn({ user: signedInUser }) {
      if (signedInUser.id) await recordLogin(signedInUser.id);
    },
  },
});

// Next.js's own `request.url` only honors `x-forwarded-proto`, not
// `x-forwarded-host` — behind a devtunnel/ngrok-style proxy in dev, that
// leaves every URL @auth/core derives from it (the OAuth redirect_uri it
// sends Microsoft during the token exchange, the post-login redirect
// target) pointing at localhost instead of the public tunnel host, one
// hop after the sign-in button correctly used it. Rewriting the request's
// URL here — before it reaches NextAuth at all — is the single point that
// fixes every one of those downstream URLs at once, the same way a static
// `AUTH_URL` would, but per-request so both a devtunnel and plain
// localhost keep working without editing env vars between them.
function withForwardedHost(req: NextRequest): NextRequest {
  const forwardedHost = req.headers.get("x-forwarded-host");
  if (!forwardedHost) return req;
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const realOrigin = `${proto}://${forwardedHost}`;
  return new NextRequest(
    req.nextUrl.href.replace(req.nextUrl.origin, realOrigin),
    req,
  );
}

export const handlers = {
  GET: (req: NextRequest) => nextAuth.handlers.GET(withForwardedHost(req)),
  POST: (req: NextRequest) => nextAuth.handlers.POST(withForwardedHost(req)),
};
export const { auth, signIn, signOut } = nextAuth;
