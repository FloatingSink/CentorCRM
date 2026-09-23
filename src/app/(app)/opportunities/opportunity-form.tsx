"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { minorUnitDigits } from "@/lib/money";
import { useT } from "@/lib/i18n/client";

const STAGES = [
  { value: "enquiry", label: "opportunityStage.enquiry" },
  { value: "technical_review", label: "opportunityStage.technical_review" },
  { value: "quoted", label: "opportunityStage.quoted" },
  { value: "negotiation", label: "opportunityStage.negotiation" },
  { value: "won", label: "opportunityStage.won" },
  { value: "lost", label: "opportunityStage.lost" },
] as const;

// Free-form, not enforced anywhere — crm-spec.md §6.4's pipeline order,
// shown as a hint since nothing in the app currently prevents skipping
// stages or moving backward. Static overview for the editable form label;
// per-stage copy (below) is for the read-only badges elsewhere that know
// the actual current value.
const OPPORTUNITY_PIPELINE_OVERVIEW = "opportunity.pipelineOverview";

// Exported so opportunities-table.tsx and [id]/page.tsx can show the same
// copy on their read-only stage badges instead of redefining it.
export const OPPORTUNITY_STAGE_HELP: Record<
  (typeof STAGES)[number]["value"],
  string
> = {
  enquiry: "opportunityStageHelp.enquiry",
  technical_review: "opportunityStageHelp.technical_review",
  quoted: "opportunityStageHelp.quoted",
  negotiation: "opportunityStageHelp.negotiation",
  won: "opportunityStageHelp.won",
  lost: "opportunityStageHelp.lost",
};

type OpportunityFormAction = (
  prevState: { error?: string } | undefined,
  formData: FormData,
) => Promise<{ error?: string }>;

type OpportunityFormValues = {
  reference: string;
  projectId: string;
  customerCompanyId: string;
  legalEntityId: string;
  title: string;
  stage:
    "enquiry" | "technical_review" | "quoted" | "negotiation" | "won" | "lost";
  estimatedValue: number | null;
  currency: string | null;
  probability: number | null;
  expectedCloseDate: Date | null;
  ownerUserId: string | null;
  lostReason: string | null;
  notes: string | null;
  isActive: boolean;
};

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function toMajorUnitsInputValue(
  estimatedValue: number | null,
  currency: string | null,
): string {
  if (estimatedValue === null || !currency) return "";
  // Display-only conversion (input defaultValue) — parseMoneyToMinorUnits on
  // the server is what actually enforces the no-float rule on save.
  const digits = minorUnitDigits(currency);
  return (estimatedValue / 10 ** digits).toFixed(digits);
}

export function OpportunityForm({
  action,
  projects,
  companies,
  legalEntities,
  users,
  defaultValues,
  mode,
  submitLabel,
}: {
  action: OpportunityFormAction;
  projects: { id: string; nameEn: string }[];
  companies: { id: string; nameEn: string }[];
  legalEntities: { id: string; nameEn: string; shortCode: string }[];
  users: { id: string; name: string | null }[];
  defaultValues?: OpportunityFormValues;
  mode: "create" | "edit";
  submitLabel: string;
}) {
  const { t } = useT();
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <Card>
      <CardContent>
        {state?.error ? (
          <p className="mb-4 text-sm text-destructive">{t(state.error)}</p>
        ) : null}
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="reference" required>
                {t("opportunity.reference")}
              </Label>
              <Input
                id="reference"
                name="reference"
                defaultValue={defaultValues?.reference}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="title" required>
                {t("opportunity.formTitle")}
              </Label>
              <Input
                id="title"
                name="title"
                defaultValue={defaultValues?.title}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="projectId" required>
                {t("opportunity.project")}
              </Label>
              <Select
                name="projectId"
                defaultValue={defaultValues?.projectId}
                items={projects.map((p) => ({ value: p.id, label: p.nameEn }))}
              >
                <SelectTrigger id="projectId">
                  <SelectValue placeholder={t("opportunity.selectProject")} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="customerCompanyId" required>
                {t("opportunity.customer")}
              </Label>
              <Select
                name="customerCompanyId"
                defaultValue={defaultValues?.customerCompanyId}
                items={companies.map((c) => ({ value: c.id, label: c.nameEn }))}
              >
                <SelectTrigger id="customerCompanyId">
                  <SelectValue placeholder={t("opportunity.selectCompany")} />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="legalEntityId" required>
                {t("opportunity.legalEntity")}
              </Label>
              <Select
                name="legalEntityId"
                defaultValue={defaultValues?.legalEntityId}
                items={legalEntities.map((le) => ({
                  value: le.id,
                  label: `${le.nameEn} (${le.shortCode})`,
                }))}
              >
                <SelectTrigger id="legalEntityId">
                  <SelectValue placeholder={t("opportunity.selectEntity")} />
                </SelectTrigger>
                <SelectContent>
                  {legalEntities.map((le) => (
                    <SelectItem key={le.id} value={le.id}>
                      {le.nameEn} ({le.shortCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Tooltip>
                <TooltipTrigger render={<span className="w-fit" />}>
                  <Label
                    htmlFor="stage"
                    className="cursor-help underline decoration-dotted underline-offset-2"
                  >
                    {t("opportunity.stage")}
                  </Label>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {OPPORTUNITY_PIPELINE_OVERVIEW}
                </TooltipContent>
              </Tooltip>
              <Select
                name="stage"
                defaultValue={defaultValues?.stage ?? "enquiry"}
                items={STAGES.map((s) => ({
                  value: s.value,
                  label: t(s.label),
                }))}
              >
                <SelectTrigger id="stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {t(s.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ownerUserId">{t("opportunity.owner")}</Label>
              <Select
                name="ownerUserId"
                defaultValue={defaultValues?.ownerUserId ?? "unassigned"}
                items={[
                  { value: "unassigned", label: t("project.noOwner") },
                  ...users.map((u) => ({ value: u.id, label: u.name ?? u.id })),
                ]}
              >
                <SelectTrigger id="ownerUserId">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    {t("project.noOwner")}
                  </SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name ?? u.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="estimatedValue">
                {t("opportunity.estimatedValue")}
              </Label>
              <Input
                id="estimatedValue"
                name="estimatedValue"
                inputMode="decimal"
                placeholder="72000.00"
                defaultValue={toMajorUnitsInputValue(
                  defaultValues?.estimatedValue ?? null,
                  defaultValues?.currency ?? null,
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="currency">{t("opportunity.currency")}</Label>
              <Input
                id="currency"
                name="currency"
                placeholder="SGD"
                maxLength={3}
                className="uppercase"
                defaultValue={defaultValues?.currency ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="probability">
                {t("opportunity.probability")}
              </Label>
              <Input
                id="probability"
                name="probability"
                type="number"
                min={0}
                max={100}
                defaultValue={defaultValues?.probability ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="expectedCloseDate">
              {t("opportunity.expectedCloseDate")}
            </Label>
            <Input
              id="expectedCloseDate"
              name="expectedCloseDate"
              type="date"
              defaultValue={toDateInputValue(
                defaultValues?.expectedCloseDate ?? null,
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Tooltip>
              <TooltipTrigger render={<span className="w-fit" />}>
                <Label
                  htmlFor="lostReason"
                  className="cursor-help underline decoration-dotted underline-offset-2"
                >
                  {t("opportunity.lostReason")}
                </Label>
              </TooltipTrigger>
              <TooltipContent side="right">
                Only meaningful when stage is set to &ldquo;Lost&rdquo;.
              </TooltipContent>
            </Tooltip>
            <Input
              id="lostReason"
              name="lostReason"
              defaultValue={defaultValues?.lostReason ?? ""}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">{t("opportunity.notes")}</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={defaultValues?.notes ?? ""}
            />
          </div>

          {mode === "edit" ? (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                name="isActive"
                value="true"
                defaultChecked={defaultValues?.isActive}
              />
              {t("common.active")}
            </label>
          ) : (
            <input type="hidden" name="isActive" value="true" />
          )}

          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? t("common.saving") : t(submitLabel)}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
