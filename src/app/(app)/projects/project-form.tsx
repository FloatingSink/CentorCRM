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
              <Label htmlFor="nameEn">Name (English)</Label>
              <Input
                id="nameEn"
                name="nameEn"
                defaultValue={defaultValues?.nameEn}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nameZh">Name (Chinese)</Label>
              <Input
                id="nameZh"
                name="nameZh"
                defaultValue={defaultValues?.nameZh ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="clientCompanyId">Client company</Label>
            <Select
              name="clientCompanyId"
              defaultValue={defaultValues?.clientCompanyId}
            >
              <SelectTrigger id="clientCompanyId">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                defaultValue={defaultValues?.country}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                defaultValue={defaultValues?.city ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                name="status"
                defaultValue={defaultValues?.status ?? "prospect"}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ownerUserId">Owner</Label>
              <Select
                name="ownerUserId"
                defaultValue={defaultValues?.ownerUserId ?? "unassigned"}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">Start date</Label>
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
              <Label htmlFor="expectedEndDate">Expected end date</Label>
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
