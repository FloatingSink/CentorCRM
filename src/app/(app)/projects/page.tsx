import Link from "next/link";

import { ProjectsTable } from "./projects-table";
import { buttonVariants } from "@/components/ui/button";
import { getProjects } from "@/server/projects";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Projects</h2>
          <p className="text-sm text-muted-foreground">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </p>
        </div>
        <Link href="/projects/new" className={buttonVariants()}>
          New project
        </Link>
      </div>

      <ProjectsTable projects={projects} />
    </div>
  );
}
