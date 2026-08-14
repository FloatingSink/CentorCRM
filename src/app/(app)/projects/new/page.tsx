import { createProjectAction } from "../actions";
import { ProjectForm } from "../project-form";
import { getCompanies } from "@/server/companies";
import { getUsers } from "@/server/users";

export default async function NewProjectPage() {
  const [companies, users] = await Promise.all([getCompanies(), getUsers()]);

  return (
    <div>
      <h2 className="mb-4 text-2xl">New project</h2>
      <ProjectForm
        action={createProjectAction}
        companies={companies}
        users={users}
        mode="create"
        submitLabel="Create project"
      />
    </div>
  );
}
