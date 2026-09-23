import { createProjectAction } from "../actions";
import { ProjectForm } from "../project-form";
import { getCompanies } from "@/server/companies";
import { getUsers } from "@/server/users";
import { t } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";

export default async function NewProjectPage() {
  const [companies, users, locale] = await Promise.all([
    getCompanies(),
    getUsers(),
    getLocale(),
  ]);

  return (
    <div>
      <h2 className="mb-4 text-2xl">{t(locale, "project.new")}</h2>
      <ProjectForm
        action={createProjectAction}
        companies={companies}
        users={users}
        mode="create"
        submitLabel="project.create"
      />
    </div>
  );
}
