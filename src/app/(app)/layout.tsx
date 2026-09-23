import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LanguageSwitcher } from "./language-switcher";
import { SidebarNav } from "./sidebar-nav";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { auth, signOut } from "@/lib/auth";
import { LocaleProvider } from "@/lib/i18n/client";
import { t } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";
import { getInitials } from "@/lib/initials";
import { getMyOpenTaskCount } from "@/server/tasks";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const [openTaskCount, locale] = await Promise.all([
    getMyOpenTaskCount(),
    getLocale(),
  ]);

  return (
    <LocaleProvider locale={locale}>
      <TooltipProvider>
        <div className="flex min-h-screen">
          <aside className="flex w-[236px] flex-none flex-col gap-7 bg-card p-4">
            <Link href="/" className="flex items-center">
              {/* Full lockup (mark + wordmark), not just an icon — replaces the
              old placeholder square + separate "Centor CRM" text span, since
              stacking that text next to a logo that already includes the
              wordmark would double it up. Intrinsic size passed as-is
              (design_handoff_centor_crm/README.md called this placeholder
              out by name); h-8/w-auto is what actually constrains it.
              public/centor-logo.png is the app's own gradient lockup, not
              the flat single-tone variant used for PDF letterheads
              (public/logos/, one per legal entity) — different asset, kept
              deliberately separate rather than reusing one file for both.

              unoptimized: Next's on-the-fly optimizer re-encodes every
              requested size as an 8-bit palette PNG, and at this image's
              native ~826px width specifically, that quantization visibly
              flattens the gradient shading on the mark — confirmed by
              diffing the served bytes against both source files, closer to
              this (correct) file, just heavily posterized, not a stale/
              cached copy of the old flat-tone variant. A ~15KB static
              brand asset has nothing to gain from that pipeline anyway —
              serving it unoptimized is both simpler and pixel-correct. */}
              <Image
                src="/centor-logo.png"
                alt="Centor CRM"
                width={826}
                height={224}
                priority
                unoptimized
                className="h-8 w-auto"
              />
            </Link>

            <SidebarNav
              isAdmin={session.user.role === "admin"}
              openTaskCount={openTaskCount}
            />

            <div className="mt-auto flex flex-col gap-2 rounded-md bg-muted p-2">
              <div className="flex items-center gap-2">
                <span className="flex size-[30px] flex-none items-center justify-center rounded-full bg-brand-800 text-xs font-medium text-brand-100">
                  {getInitials(session.user.name ?? session.user.email ?? "?")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px]">
                    {session.user.name ?? session.user.email}
                  </p>
                  {/* capitalize dropped: it does nothing to Chinese and the
                  role label now comes from the dictionary already cased. */}
                  <p className="truncate text-[11px] text-muted-foreground">
                    {t(locale, `role.${session.user.role}`)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <LanguageSwitcher />
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/sign-in" });
                  }}
                >
                  <Button type="submit" variant="ghost" size="sm">
                    {t(locale, "common.signOut")}
                  </Button>
                </form>
              </div>
            </div>
          </aside>
          <main className="flex-1 p-7">{children}</main>
        </div>
      </TooltipProvider>
    </LocaleProvider>
  );
}
