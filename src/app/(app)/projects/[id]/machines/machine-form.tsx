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
import { useT } from "@/lib/i18n/client";

type MachineFormAction = (
  prevState: { error?: string } | undefined,
  formData: FormData,
) => Promise<{ error?: string }>;

type MachineFormValues = {
  designation: string;
  manufacturer: string | null;
  diameterMm: number | null;
  machineType: "EPB" | "slurry" | "TBM_hard_rock" | "other";
  notes: string | null;
  isActive: boolean;
};

export function MachineForm({
  action,
  defaultValues,
  mode,
  submitLabel,
}: {
  action: MachineFormAction;
  defaultValues?: MachineFormValues;
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="designation">{t("machine.designation")}</Label>
            <Input
              id="designation"
              name="designation"
              placeholder={t("machine.designationPlaceholder")}
              defaultValue={defaultValues?.designation}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="machineType">{t("machine.type")}</Label>
              <Select
                name="machineType"
                defaultValue={defaultValues?.machineType}
                items={[
                  { value: "EPB", label: t("machineType.EPB") },
                  { value: "slurry", label: t("machineType.slurry") },
                  {
                    value: "TBM_hard_rock",
                    label: t("machineType.TBM_hard_rock"),
                  },
                  { value: "other", label: t("machineType.other") },
                ]}
              >
                <SelectTrigger id="machineType">
                  <SelectValue placeholder={t("machine.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EPB">{t("machineType.EPB")}</SelectItem>
                  <SelectItem value="slurry">
                    {t("machineType.slurry")}
                  </SelectItem>
                  <SelectItem value="TBM_hard_rock">
                    {t("machineType.TBM_hard_rock")}
                  </SelectItem>
                  <SelectItem value="other">
                    {t("productCategory.other")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="diameterMm">{t("machine.diameterMm")}</Label>
              <Input
                id="diameterMm"
                name="diameterMm"
                type="number"
                min={0}
                defaultValue={defaultValues?.diameterMm ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="manufacturer">{t("machine.manufacturer")}</Label>
            <Input
              id="manufacturer"
              name="manufacturer"
              defaultValue={defaultValues?.manufacturer ?? ""}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">{t("machine.notes")}</Label>
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
