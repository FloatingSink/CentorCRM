import { createOpportunityAction } from "../actions";
import { OpportunityForm } from "../opportunity-form";
import { getCompanies } from "@/server/companies";
import { getLegalEntities } from "@/server/legal-entities";
import { getProjects } from "@/server/projects";
import { getUsers } from "@/server/users";
import { t } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";

export default async function NewOpportunityPage() {
  const [projects, companies, legalEntities, users, locale] = await Promise.all(
    [
      getProjects(),
      getCompanies(),
      getLegalEntities(),
      getUsers(),
      getLocale(),
    ],
  );

  return (
    <div>
      <h2 className="mb-4 text-2xl">{t(locale, "opportunity.new")}</h2>
      <OpportunityForm
        action={createOpportunityAction}
        projects={projects}
        companies={companies}
        legalEntities={legalEntities}
        users={users}
        mode="create"
        submitLabel="opportunity.create"
      />
    </div>
  );
}
