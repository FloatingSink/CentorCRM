import { redirect } from "next/navigation";

import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLegalEntities } from "@/server/legal-entities";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const legalEntities = await getLegalEntities();

  return (
    <div className="mx-auto max-w-3xl p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">CENTOR CRM</h1>
          <p className="text-sm text-muted-foreground">
            {session.user.name} · {session.user.email} · {session.user.role}
          </p>
        </div>
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
      </header>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Short code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Jurisdiction</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {legalEntities.map((entity) => (
            <TableRow key={entity.id}>
              <TableCell className="font-medium">{entity.shortCode}</TableCell>
              <TableCell>{entity.nameEn}</TableCell>
              <TableCell>{entity.jurisdiction}</TableCell>
              <TableCell>{entity.defaultCurrency}</TableCell>
              <TableCell>{entity.isActive ? "Yes" : "No"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
