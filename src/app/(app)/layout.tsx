import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

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
    <div className="mx-auto max-w-4xl p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">CENTOR CRM</h1>
          <p className="text-sm text-muted-foreground">
            {session.user.name} · {session.user.email} · {session.user.role}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/">Home</Link>
            <Link href="/companies">Companies</Link>
            <Link href="/contacts">Contacts</Link>
          </nav>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/sign-in" });
            }}
          >
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
