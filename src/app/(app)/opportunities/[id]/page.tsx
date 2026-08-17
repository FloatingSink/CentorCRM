import { Handshake } from "lucide-react";
import { notFound } from "next/navigation";

import { updateOpportunityAction } from "../actions";
import { OPPORTUNITY_STAGE_HELP, OpportunityForm } from "../opportunity-form";
import { ActivityTimeline } from "@/components/activity-timeline";
import { DocumentLibrary } from "@/components/document-library";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getActivitiesForRelated } from "@/server/activities";
import { getCompanies } from "@/server/companies";
import { getDocumentsForRelated } from "@/server/documents";
import { getLegalEntities } from "@/server/legal-entities";
import { getOpportunityById } from "@/server/opportunities";
import { getProjects } from "@/server/projects";
import { getUsers } from "@/server/users";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [
    opportunity,
    projects,
    companies,
    legalEntities,
    users,
    activities,
    documents,
  ] = await Promise.all([
    getOpportunityById(id),
    getProjects(),
    getCompanies(),
    getLegalEntities(),
    getUsers(),
    getActivitiesForRelated("opportunity", id),
    getDocumentsForRelated("opportunity", id),
  ]);
  if (!opportunity) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3.5">
        <span className="flex size-[52px] flex-none items-center justify-center rounded-md border border-primary text-primary">
          <Handshake className="size-6" />
        </span>
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl">{opportunity.reference}</h2>
            <Tooltip>
              <TooltipTrigger render={<span className="inline-block" />}>
                <Badge variant="secondary" className="capitalize">
                  {opportunity.stage.replace(/_/g, " ")}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {OPPORTUNITY_STAGE_HELP[opportunity.stage]}
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground">{opportunity.title}</p>
        </div>
      </div>

      <OpportunityForm
        action={updateOpportunityAction.bind(null, id)}
        projects={projects}
        companies={companies}
        legalEntities={legalEntities}
        users={users}
        defaultValues={{
          reference: opportunity.reference,
          projectId: opportunity.projectId,
          customerCompanyId: opportunity.customerCompanyId,
          legalEntityId: opportunity.legalEntityId,
          title: opportunity.title,
          stage: opportunity.stage,
          estimatedValue: opportunity.estimatedValue,
          currency: opportunity.currency,
          probability: opportunity.probability,
          expectedCloseDate: opportunity.expectedCloseDate,
          ownerUserId: opportunity.ownerUserId,
          lostReason: opportunity.lostReason,
          notes: opportunity.notes,
          isActive: opportunity.isActive,
        }}
        mode="edit"
        submitLabel="Save changes"
      />

      <DocumentLibrary
        relatedType="opportunity"
        relatedId={id}
        documents={documents}
      />

      <ActivityTimeline
        relatedType="opportunity"
        relatedId={id}
        activities={activities}
      />
    </div>
  );
}
