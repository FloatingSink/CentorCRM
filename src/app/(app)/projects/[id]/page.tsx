import { HardHat } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updateProjectAction } from "../actions";
import { ProjectForm, PROJECT_STATUS_HELP } from "../project-form";
import { ActivityTimeline } from "@/components/activity-timeline";
import { DocumentLibrary } from "@/components/document-library";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getActivitiesForRelated } from "@/server/activities";
import { getCompanies } from "@/server/companies";
import { getDocumentsForRelated } from "@/server/documents";
import { getProjectById } from "@/server/projects";
import { getUsers } from "@/server/users";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, companies, users, activities, documents] = await Promise.all([
    getProjectById(id),
    getCompanies(),
    getUsers(),
    getActivitiesForRelated("project", id),
    getDocumentsForRelated("project", id),
  ]);
  if (!result) {
    notFound();
  }

  const { project, machines } = result;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3.5">
        <span className="flex size-[52px] flex-none items-center justify-center rounded-md border border-primary text-primary">
          <HardHat className="size-6" />
        </span>
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl">{project.nameEn}</h2>
            <Tooltip>
              <TooltipTrigger render={<span className="inline-block" />}>
                <Badge variant="secondary" className="capitalize">
                  {project.status.replace("_", " ")}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {PROJECT_STATUS_HELP[project.status]}
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground">{project.country}</p>
        </div>
      </div>

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

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg">Machines</h3>
          <Link
            href={`/projects/${id}/machines/new`}
            className={buttonVariants()}
          >
            Add machine
          </Link>
        </div>
        <Card className="py-4">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Designation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Diameter (mm)</TableHead>
                  <TableHead className="pr-4">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {machines.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="pl-4 font-medium">
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
                    <TableCell className="pr-4">
                      {m.isActive ? "Yes" : "No"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <DocumentLibrary
        relatedType="project"
        relatedId={id}
        documents={documents}
      />

      <ActivityTimeline
        relatedType="project"
        relatedId={id}
        activities={activities}
      />
    </div>
  );
}
