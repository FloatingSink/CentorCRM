import Link from "next/link";

import { ProjectsTable } from "./projects-table";
import { buttonVariants } from "@/components/ui/button";
import { getProjects } from "@/server/projects";
import { t, tCount } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";

export default async function ProjectsPage() {
  const [projects, locale] = await Promise.all([getProjects(), getLocale()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">{t(locale, "project.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {tCount(locale, "project.count", projects.length)}
          </p>
        </div>
        <Link href="/projects/new" className={buttonVariants()}>
          {t(locale, "project.new")}
        </Link>
      </div>

      <ProjectsTable projects={projects} />
    </div>
  );
}
