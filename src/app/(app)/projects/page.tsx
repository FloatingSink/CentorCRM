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
import { getProjects } from "@/server/projects";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Projects</h2>
        <Link href="/projects/new" className={buttonVariants()}>
          New project
        </Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">
                <Link href={`/projects/${p.id}`} className="hover:underline">
                  {p.nameEn}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/companies/${p.clientCompanyId}`}
                  className="hover:underline"
                >
                  {p.clientCompanyName}
                </Link>
              </TableCell>
              <TableCell>{p.country}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="capitalize">
                  {p.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>{p.isActive ? "Yes" : "No"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
