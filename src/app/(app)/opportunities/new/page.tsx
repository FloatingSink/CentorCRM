import { createOpportunityAction } from "../actions";
import { OpportunityForm } from "../opportunity-form";
import { getCompanies } from "@/server/companies";
import { getLegalEntities } from "@/server/legal-entities";
import { getProjects } from "@/server/projects";
import { getUsers } from "@/server/users";

export default async function NewOpportunityPage() {
  const [projects, companies, legalEntities, users] = await Promise.all([
    getProjects(),
    getCompanies(),
    getLegalEntities(),
    getUsers(),
  ]);

  return (
    <div>
      <h2 className="mb-4 text-2xl">New opportunity</h2>
      <OpportunityForm
        action={createOpportunityAction}
        projects={projects}
        companies={companies}
        legalEntities={legalEntities}
        users={users}
        mode="create"
        submitLabel="Create opportunity"
      />
    </div>
  );
}
