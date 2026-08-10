import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCompanies } from "@/server/companies";

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Companies</h2>
        <Link href="/companies/new" className={buttonVariants()}>
          New company
        </Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">
                <Link href={`/companies/${c.id}`} className="hover:underline">
                  {c.nameEn}
                </Link>
              </TableCell>
              <TableCell>{c.country}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {c.roles.map((role) => (
                    <Badge
                      key={role}
                      variant="secondary"
                      className="capitalize"
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>{c.isActive ? "Yes" : "No"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
