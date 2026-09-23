"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COMPANY_ROLES } from "@/lib/company-roles";
import { useT } from "@/lib/i18n/client";

type CompanyFormAction = (
  prevState: { error?: string } | undefined,
  formData: FormData,
) => Promise<{ error?: string }>;

type CompanyFormValues = {
  nameEn: string;
  nameZh: string | null;
  country: string;
  registrationNo: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
  isActive: boolean;
  roles: string[];
};

export function CompanyForm({
  action,
  defaultValues,
  mode,
  submitLabel,
}: {
  action: CompanyFormAction;
  defaultValues?: CompanyFormValues;
  mode: "create" | "edit";
  // A dictionary key, resolved here — call sites pass e.g. "company.create".
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
              <Label htmlFor="nameEn" required>
                {t("company.nameEn")}
              </Label>
              <Input
                id="nameEn"
                name="nameEn"
                defaultValue={defaultValues?.nameEn}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nameZh">{t("company.nameZh")}</Label>
              <Input
                id="nameZh"
                name="nameZh"
                defaultValue={defaultValues?.nameZh ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="country" required>
                {t("company.country")}
              </Label>
              <Input
                id="country"
                name="country"
                defaultValue={defaultValues?.country}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="registrationNo">
                {t("company.registrationNo")}
              </Label>
              <Input
                id="registrationNo"
                name="registrationNo"
                defaultValue={defaultValues?.registrationNo ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="address">{t("company.address")}</Label>
            <Textarea
              id="address"
              name="address"
              defaultValue={defaultValues?.address ?? ""}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="website">{t("company.website")}</Label>
            <Input
              id="website"
              name="website"
              defaultValue={defaultValues?.website ?? ""}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">{t("company.notes")}</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={defaultValues?.notes ?? ""}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label required>{t("company.roles")}</Label>
            <div className="flex flex-wrap gap-4">
              {COMPANY_ROLES.map((role) => (
                <label key={role} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    name="roles"
                    value={role}
                    defaultChecked={defaultValues?.roles.includes(role)}
                  />
                  {t(`companyRole.${role}`)}
                </label>
              ))}
            </div>
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
