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

type ContactFormAction = (
  prevState: { error?: string } | undefined,
  formData: FormData,
) => Promise<{ error?: string }>;

type ContactFormValues = {
  companyId: string | null;
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
            <Label htmlFor="companyId">{t("contact.company")}</Label>
            <Select
              name="companyId"
              defaultValue={
                defaultValues?.companyId ?? defaultCompanyId ?? "none"
              }
              items={[
                { value: "none", label: t("contact.none") },
                ...companies.map((c) => ({ value: c.id, label: c.nameEn })),
              ]}
            >
              <SelectTrigger id="companyId">
                <SelectValue placeholder={t("contact.selectCompany")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("contact.none")}</SelectItem>
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
              <Label htmlFor="nameEn">{t("contact.nameEn")}</Label>
              <Input
                id="nameEn"
                name="nameEn"
                defaultValue={defaultValues?.nameEn}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nameZh">{t("contact.nameZh")}</Label>
              <Input
                id="nameZh"
                name="nameZh"
                defaultValue={defaultValues?.nameZh ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="jobTitle">{t("contact.jobTitle")}</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                defaultValue={defaultValues?.jobTitle ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="preferredLanguage">
                {t("contact.preferredLanguage")}
              </Label>
              <Select
                name="preferredLanguage"
                defaultValue={defaultValues?.preferredLanguage ?? "en"}
                items={[
                  { value: "en", label: t("language.en") },
                  { value: "zh", label: t("language.zh") },
                ]}
              >
                <SelectTrigger id="preferredLanguage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("language.en")}</SelectItem>
                  <SelectItem value="zh">{t("language.zh")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t("contact.email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={defaultValues?.email ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">{t("contact.phone")}</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={defaultValues?.phone ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="wechatId">{t("contact.wechatId")}</Label>
            <Input
              id="wechatId"
              name="wechatId"
              defaultValue={defaultValues?.wechatId ?? ""}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">{t("contact.notes")}</Label>
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
              {t("contact.primaryContact")}
            </label>
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
          </div>

          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? t("common.saving") : t(submitLabel)}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
