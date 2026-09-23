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
import { useT } from "@/lib/i18n/client";

// Exported so projects-table.tsx and [id]/page.tsx can show the same copy
// on their read-only status badges instead of redefining it. Free-form,
// not enforced anywhere — no gating logic exists for project status.
// i18n dictionary keys, resolved by each consumer through t().
export const PROJECT_STATUS_HELP: Record<
  "prospect" | "active" | "on_hold" | "completed",
  string
> = {
  prospect: "projectStatusHelp.prospect",
  active: "projectStatusHelp.active",
  on_hold: "projectStatusHelp.on_hold",
  completed: "projectStatusHelp.completed",
};

type ProjectFormAction = (
  prevState: { error?: string } | undefined,
  formData: FormData,
) => Promise<{ error?: string }>;

type ProjectFormValues = {
  nameEn: string;
  nameZh: string | null;
  clientCompanyId: string;
  country: string;
  city: string | null;
  status: "prospect" | "active" | "on_hold" | "completed";
  startDate: Date | null;
  expectedEndDate: Date | null;
  ownerUserId: string | null;
  notes: string | null;
  isActive: boolean;
};

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function ProjectForm({
  action,
  companies,
  users,
  defaultValues,
  mode,
  submitLabel,
}: {
  action: ProjectFormAction;
  companies: { id: string; nameEn: string }[];
  users: { id: string; name: string | null }[];
  defaultValues?: ProjectFormValues;
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
              <Label htmlFor="nameEn">{t("project.nameEn")}</Label>
              <Input
                id="nameEn"
                name="nameEn"
                defaultValue={defaultValues?.nameEn}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nameZh">{t("project.nameZh")}</Label>
              <Input
                id="nameZh"
                name="nameZh"
                defaultValue={defaultValues?.nameZh ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="clientCompanyId">
              {t("project.clientCompany")}
            </Label>
            <Select
              name="clientCompanyId"
              defaultValue={defaultValues?.clientCompanyId}
              items={companies.map((c) => ({ value: c.id, label: c.nameEn }))}
            >
              <SelectTrigger id="clientCompanyId">
                <SelectValue placeholder={t("project.selectCompany")} />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="country">{t("project.country")}</Label>
              <Input
                id="country"
                name="country"
                defaultValue={defaultValues?.country}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="city">{t("project.city")}</Label>
              <Input
                id="city"
                name="city"
                defaultValue={defaultValues?.city ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Tooltip>
                <TooltipTrigger render={<span className="w-fit" />}>
                  <Label
                    htmlFor="status"
                    className="cursor-help underline decoration-dotted underline-offset-2"
                  >
                    {t("project.status")}
                  </Label>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Prospect: no business won yet. Active: has live
                  opportunities/orders. On hold: paused. Completed: closed out.
                </TooltipContent>
              </Tooltip>
              <Select
                name="status"
                defaultValue={defaultValues?.status ?? "prospect"}
                items={[
                  { value: "prospect", label: t("projectStatus.prospect") },
                  { value: "active", label: t("projectStatus.active") },
                  { value: "on_hold", label: t("projectStatus.on_hold") },
                  { value: "completed", label: t("projectStatus.completed") },
                ]}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">
                    {t("projectStatus.prospect")}
                  </SelectItem>
                  <SelectItem value="active">{t("common.active")}</SelectItem>
                  <SelectItem value="on_hold">
                    {t("projectStatus.on_hold")}
                  </SelectItem>
                  <SelectItem value="completed">
                    {t("projectStatus.completed")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ownerUserId">{t("project.owner")}</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">{t("project.startDate")}</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={toDateInputValue(
                  defaultValues?.startDate ?? null,
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="expectedEndDate">
                {t("project.expectedEndDate")}
              </Label>
              <Input
                id="expectedEndDate"
                name="expectedEndDate"
                type="date"
                defaultValue={toDateInputValue(
                  defaultValues?.expectedEndDate ?? null,
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">{t("project.notes")}</Label>
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
