import Link from "next/link";
import { notFound } from "next/navigation";

import { updateProjectAction } from "../actions";
import { ProjectForm } from "../project-form";
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
import { getProjectById } from "@/server/projects";
import { getUsers } from "@/server/users";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, companies, users] = await Promise.all([
    getProjectById(id),
    getCompanies(),
    getUsers(),
  ]);
  if (!result) {
    notFound();
  }

  const { project, machines } = result;

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">{project.nameEn}</h2>
      <ProjectForm
        action={updateProjectAction.bind(null, id)}
        companies={companies}
        users={users}
        defaultValues={{
          nameEn: project.nameEn,
          nameZh: project.nameZh,
          clientCompanyId: project.clientCompanyId,
          country: project.country,
          city: project.city,
          status: project.status,
          startDate: project.startDate,
          expectedEndDate: project.expectedEndDate,
          ownerUserId: project.ownerUserId,
          notes: project.notes,
          isActive: project.isActive,
        }}
        mode="edit"
        submitLabel="Save changes"
      />

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Machines</h3>
          <Link
            href={`/projects/${id}/machines/new`}
            className={buttonVariants()}
          >
            Add machine
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Designation</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Diameter (mm)</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {machines.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/projects/${id}/machines/${m.id}`}
                    className="hover:underline"
                  >
                    {m.designation}
                  </Link>
                </TableCell>
                <TableCell>{m.machineType}</TableCell>
                <TableCell>{m.manufacturer}</TableCell>
                <TableCell>{m.diameterMm}</TableCell>
                <TableCell>{m.isActive ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
