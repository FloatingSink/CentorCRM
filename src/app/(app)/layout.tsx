import Link from "next/link";
import { redirect } from "next/navigation";

import { SidebarNav } from "./sidebar-nav";
import { Button } from "@/components/ui/button";
import { auth, signOut } from "@/lib/auth";
import { getInitials } from "@/lib/initials";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-[236px] flex-none flex-col gap-7 bg-card p-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-[26px] flex-none items-center justify-center rounded-[7px] border border-primary" />
          <span className="font-heading text-base">Centor CRM</span>
        </Link>

        <SidebarNav />

        <div className="mt-auto flex items-center gap-2 rounded-md bg-muted p-2">
          <span className="flex size-[30px] flex-none items-center justify-center rounded-full bg-brand-800 text-xs font-medium text-brand-100">
            {getInitials(session.user.name ?? session.user.email ?? "?")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px]">
              {session.user.name ?? session.user.email}
            </p>
            <p className="truncate text-[11px] text-muted-foreground capitalize">
              {session.user.role}
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/sign-in" });
            }}
          >
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-7">{children}</main>
    </div>
  );
}
