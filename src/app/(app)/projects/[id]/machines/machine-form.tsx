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
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <Card>
      <CardContent>
        {state?.error ? (
          <p className="mb-4 text-sm text-destructive">{state.error}</p>
        ) : null}
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="designation">Designation</Label>
            <Input
              id="designation"
              name="designation"
              placeholder="e.g. TBM-1"
              defaultValue={defaultValues?.designation}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="machineType">Type</Label>
              <Select
                name="machineType"
                defaultValue={defaultValues?.machineType}
                items={[
                  { value: "EPB", label: "EPB" },
                  { value: "slurry", label: "Slurry" },
                  { value: "TBM_hard_rock", label: "TBM hard rock" },
                  { value: "other", label: "Other" },
                ]}
              >
                <SelectTrigger id="machineType">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EPB">EPB</SelectItem>
                  <SelectItem value="slurry">Slurry</SelectItem>
                  <SelectItem value="TBM_hard_rock">TBM hard rock</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="diameterMm">Diameter (mm)</Label>
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
            <Label htmlFor="manufacturer">Manufacturer</Label>
            <Input
              id="manufacturer"
              name="manufacturer"
              defaultValue={defaultValues?.manufacturer ?? ""}
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
