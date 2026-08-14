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

type ContactFormAction = (
  prevState: { error?: string } | undefined,
  formData: FormData,
) => Promise<{ error?: string }>;

type ContactFormValues = {
  companyId: string;
  nameEn: string;
  nameZh: string | null;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  wechatId: string | null;
  preferredLanguage: "en" | "zh";
  isPrimary: boolean;
  isActive: boolean;
  notes: string | null;
};

export function ContactForm({
  action,
  companies,
  defaultValues,
  defaultCompanyId,
  mode,
  submitLabel,
}: {
  action: ContactFormAction;
  companies: { id: string; nameEn: string }[];
  defaultValues?: ContactFormValues;
  defaultCompanyId?: string;
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
            <Label htmlFor="companyId">Company</Label>
            <Select
              name="companyId"
              defaultValue={defaultValues?.companyId ?? defaultCompanyId}
              items={companies.map((c) => ({ value: c.id, label: c.nameEn }))}
            >
              <SelectTrigger id="companyId">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                defaultValue={defaultValues?.jobTitle ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="preferredLanguage">Preferred language</Label>
              <Select
                name="preferredLanguage"
                defaultValue={defaultValues?.preferredLanguage ?? "en"}
                items={[
                  { value: "en", label: "English" },
                  { value: "zh", label: "Chinese" },
                ]}
              >
                <SelectTrigger id="preferredLanguage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={defaultValues?.email ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={defaultValues?.phone ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="wechatId">WeChat ID</Label>
            <Input
              id="wechatId"
              name="wechatId"
              defaultValue={defaultValues?.wechatId ?? ""}
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

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                name="isPrimary"
                value="true"
                defaultChecked={defaultValues?.isPrimary}
              />
              Primary contact
            </label>
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
          </div>

          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? "Saving…" : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
