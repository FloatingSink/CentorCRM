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

const PRODUCT_CATEGORIES = [
  { value: "tail_seal_grease", label: "Tail seal grease" },
  { value: "soil_conditioner", label: "Soil conditioner" },
  { value: "ep_grease", label: "EP grease" },
  { value: "polymer", label: "Polymer" },
  { value: "anti_wear", label: "Anti-wear" },
  { value: "other", label: "Other" },
] as const;

type ProductFormAction = (
  prevState: { error?: string } | undefined,
  formData: FormData,
) => Promise<{ error?: string }>;

type ProductFormValues = {
  centorCode: string;
  nameEn: string;
  nameZh: string | null;
  category:
    | "tail_seal_grease"
    | "soil_conditioner"
    | "ep_grease"
    | "polymer"
    | "anti_wear"
    | "other"
    | null;
  uom: string | null;
  packSize: string | null;
  packDescription: string | null;
  manufacturerCompanyId: string | null;
  manufacturerPartNo: string | null;
  hsCode: string | null;
  notes: string | null;
  isActive: boolean;
};

export function ProductForm({
  action,
  companies,
  defaultValues,
  mode,
  submitLabel,
}: {
  action: ProductFormAction;
  companies: { id: string; nameEn: string }[];
  defaultValues?: ProductFormValues;
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
              <Label htmlFor="centorCode" required>
                CENTOR code
              </Label>
              <Input
                id="centorCode"
                name="centorCode"
                defaultValue={defaultValues?.centorCode}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                name="category"
                defaultValue={defaultValues?.category ?? "unspecified"}
                items={[
                  { value: "unspecified", label: "Unspecified" },
                  ...PRODUCT_CATEGORIES,
                ]}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unspecified">Unspecified</SelectItem>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nameEn" required>
                Name (English)
              </Label>
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
              <Label htmlFor="uom">Unit of measure</Label>
              <Input
                id="uom"
                name="uom"
                defaultValue={defaultValues?.uom ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="packSize">Pack size</Label>
              <Input
                id="packSize"
                name="packSize"
                defaultValue={defaultValues?.packSize ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="packDescription">Pack description</Label>
            <Input
              id="packDescription"
              name="packDescription"
              defaultValue={defaultValues?.packDescription ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="manufacturerCompanyId">Manufacturer</Label>
              <Select
                name="manufacturerCompanyId"
                defaultValue={defaultValues?.manufacturerCompanyId ?? "none"}
                items={[
                  { value: "none", label: "None" },
                  ...companies.map((c) => ({ value: c.id, label: c.nameEn })),
                ]}
              >
                <SelectTrigger id="manufacturerCompanyId">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="manufacturerPartNo">Manufacturer part no.</Label>
              <Input
                id="manufacturerPartNo"
                name="manufacturerPartNo"
                defaultValue={defaultValues?.manufacturerPartNo ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="hsCode">HS code</Label>
            <Input
              id="hsCode"
              name="hsCode"
              defaultValue={defaultValues?.hsCode ?? ""}
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
