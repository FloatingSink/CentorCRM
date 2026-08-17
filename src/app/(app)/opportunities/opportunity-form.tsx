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

const STAGES = [
  { value: "enquiry", label: "Enquiry" },
  { value: "technical_review", label: "Technical review" },
  { value: "quoted", label: "Quoted" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

// Free-form, not enforced anywhere — crm-spec.md §6.4's pipeline order,
// shown as a hint since nothing in the app currently prevents skipping
// stages or moving backward. Static overview for the editable form label;
// per-stage copy (below) is for the read-only badges elsewhere that know
// the actual current value.
const OPPORTUNITY_PIPELINE_OVERVIEW =
  "Pipeline order: Enquiry → Technical review → Quoted → Negotiation → Won/Lost. Free-form — changing this doesn't trigger anything automatically.";

// Exported so opportunities-table.tsx and [id]/page.tsx can show the same
// copy on their read-only stage badges instead of redefining it.
export const OPPORTUNITY_STAGE_HELP: Record<
  (typeof STAGES)[number]["value"],
  string
> = {
  enquiry: "Initial contact — not yet technically reviewed or quoted.",
  technical_review:
    "Being evaluated for technical fit before a quote is issued.",
  quoted: "A quotation has been issued for this opportunity.",
  negotiation: "In discussion with the customer on terms or price.",
  won: "Won — a terminal stage.",
  lost: 'Lost — a terminal stage. See "Lost reason" below.',
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
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <Card>
      <CardContent>
        {state?.error ? (
          <p className="mb-4 text-sm text-destructive">{state.error}</p>
        ) : null}
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="reference" required>
                Reference
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
                Title
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
                Project
              </Label>
              <Select
                name="projectId"
                defaultValue={defaultValues?.projectId}
                items={projects.map((p) => ({ value: p.id, label: p.nameEn }))}
              >
                <SelectTrigger id="projectId">
                  <SelectValue placeholder="Select a project" />
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
                Customer
              </Label>
              <Select
                name="customerCompanyId"
                defaultValue={defaultValues?.customerCompanyId}
                items={companies.map((c) => ({ value: c.id, label: c.nameEn }))}
              >
                <SelectTrigger id="customerCompanyId">
                  <SelectValue placeholder="Select a company" />
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
                Legal entity
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
                  <SelectValue placeholder="Select an entity" />
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
                    Stage
                  </Label>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {OPPORTUNITY_PIPELINE_OVERVIEW}
                </TooltipContent>
              </Tooltip>
              <Select
                name="stage"
                defaultValue={defaultValues?.stage ?? "enquiry"}
                items={STAGES}
              >
                <SelectTrigger id="stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ownerUserId">Owner</Label>
              <Select
                name="ownerUserId"
                defaultValue={defaultValues?.ownerUserId ?? "unassigned"}
                items={[
                  { value: "unassigned", label: "No owner" },
                  ...users.map((u) => ({ value: u.id, label: u.name ?? u.id })),
                ]}
              >
                <SelectTrigger id="ownerUserId">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">No owner</SelectItem>
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
              <Label htmlFor="estimatedValue">Estimated value</Label>
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
              <Label htmlFor="currency">Currency</Label>
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
              <Label htmlFor="probability">Probability (%)</Label>
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
            <Label htmlFor="expectedCloseDate">Expected close date</Label>
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
                  Lost reason
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
            <Label htmlFor="notes">Notes</Label>
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
              Active
            </label>
          ) : (
            <input type="hidden" name="isActive" value="true" />
          )}

          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? "Saving…" : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
