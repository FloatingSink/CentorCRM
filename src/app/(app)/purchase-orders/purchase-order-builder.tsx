"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createPurchaseOrderAction,
  updatePurchaseOrderAction,
  updatePurchaseOrderStatusAction,
} from "./actions";
import {
  emptyLine,
  lineRowsFromExisting,
  OrderLineEditor,
  type LineRow,
} from "@/components/order-line-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Segmented, SegmentedItem } from "@/components/ui/segmented";
import { Textarea } from "@/components/ui/textarea";

const INCOTERMS = ["EXW", "FOB", "CFR", "CIF", "DAP"] as const;
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "zh", label: "Chinese" },
  { value: "bilingual", label: "Bilingual" },
] as const;
const STATUSES = [
  "draft",
  "confirmed",
  "in_production",
  "shipped",
  "completed",
  "cancelled",
] as const;

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function PurchaseOrderBuilder({
  mode,
  purchaseOrderId,
  orderNo,
  status,
  legalEntities,
  companies,
  projects,
  products,
  salesOrders,
  defaultHeader,
  defaultLines,
}: {
  mode: "create" | "edit";
  purchaseOrderId?: string;
  orderNo?: string;
  status?: string;
  legalEntities: { id: string; nameEn: string; shortCode: string }[];
  companies: { id: string; nameEn: string }[];
  projects: { id: string; nameEn: string }[];
  products: { id: string; centorCode: string; nameEn: string }[];
  salesOrders: { id: string; orderNo: string }[];
  defaultHeader: {
    legalEntityId: string;
    supplierCompanyId: string | null;
    supplierLegalEntityId: string | null;
    projectId: string;
    linkedSalesOrderId: string | null;
    signedDate: Date | null;
    deliveryLocation: string | null;
    requiredDeliveryDate: Date | null;
    currency: string;
    fxRateToSgd: string;
    incoterm: string | null;
    namedPlace: string | null;
    deliveryMethod: string | null;
    paymentMethod: string | null;
    inspectionDays: number | null;
    governingLaw: string | null;
    arbitrationRules: string | null;
    contractNo: string | null;
    language: string;
    notes: string | null;
  };
  defaultLines?: {
    productId: string;
    descriptionOverride: string | null;
    quantity: number;
    uom: string | null;
    unitPrice: number;
    discountPct: string | null;
    netWeightKg: string | null;
  }[];
}) {
  const router = useRouter();
  const [legalEntityId, setLegalEntityId] = useState(
    defaultHeader.legalEntityId,
  );
  const [supplierType, setSupplierType] = useState<"company" | "legalEntity">(
    defaultHeader.supplierLegalEntityId ? "legalEntity" : "company",
  );
  const [supplierCompanyId, setSupplierCompanyId] = useState(
    defaultHeader.supplierCompanyId ?? "",
  );
  const [supplierLegalEntityId, setSupplierLegalEntityId] = useState(
    defaultHeader.supplierLegalEntityId ?? "",
  );
  const [projectId, setProjectId] = useState(defaultHeader.projectId);
  const [linkedSalesOrderId, setLinkedSalesOrderId] = useState(
    defaultHeader.linkedSalesOrderId ?? "",
  );
  const [signedDate, setSignedDate] = useState(
    toDateInputValue(defaultHeader.signedDate),
  );
  const [deliveryLocation, setDeliveryLocation] = useState(
    defaultHeader.deliveryLocation ?? "",
  );
  const [requiredDeliveryDate, setRequiredDeliveryDate] = useState(
    toDateInputValue(defaultHeader.requiredDeliveryDate),
  );
  const [currency, setCurrency] = useState(defaultHeader.currency);
  const [fxRateToSgd, setFxRateToSgd] = useState(defaultHeader.fxRateToSgd);
  const [incoterm, setIncoterm] = useState(defaultHeader.incoterm ?? "");
  const [namedPlace, setNamedPlace] = useState(defaultHeader.namedPlace ?? "");
  const [deliveryMethod, setDeliveryMethod] = useState(
    defaultHeader.deliveryMethod ?? "",
  );
  const [paymentMethod, setPaymentMethod] = useState(
    defaultHeader.paymentMethod ?? "",
  );
  const [inspectionDays, setInspectionDays] = useState(
    defaultHeader.inspectionDays !== null
      ? String(defaultHeader.inspectionDays)
      : "",
  );
  const [governingLaw, setGoverningLaw] = useState(
    defaultHeader.governingLaw ?? "",
  );
  const [arbitrationRules, setArbitrationRules] = useState(
    defaultHeader.arbitrationRules ?? "",
  );
  const [contractNo, setContractNo] = useState(defaultHeader.contractNo ?? "");
  const [language, setLanguage] = useState(defaultHeader.language);
  const [notes, setNotes] = useState(defaultHeader.notes ?? "");

  // initialLines is recomputed each render but only ever read by the two
  // useState initializers below, which React only invokes once (on mount) —
  // computing it once per render as a plain variable keeps the line keys
  // used for `lines` and `netWeights` in sync, since lineRowsFromExisting
  // generates a fresh crypto.randomUUID() per call and calling it twice
  // independently would produce two different, unmatchable key sets.
  const initialLines = defaultLines
    ? lineRowsFromExisting(defaultLines)
    : [emptyLine()];
  const [lines, setLines] = useState<LineRow[]>(initialLines);
  const [netWeights, setNetWeights] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    defaultLines?.forEach((l, i) => {
      if (l.netWeightKg) map[initialLines[i].key] = l.netWeightKg;
    });
    return map;
  });

  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  function buildPayload() {
    return {
      header: {
        legalEntityId,
        supplierCompanyId:
          supplierType === "company" ? supplierCompanyId : null,
        supplierLegalEntityId:
          supplierType === "legalEntity" ? supplierLegalEntityId : null,
        projectId,
        linkedSalesOrderId: linkedSalesOrderId || null,
        signedDate: signedDate || null,
        deliveryLocation: deliveryLocation || null,
        requiredDeliveryDate: requiredDeliveryDate || null,
        currency,
        fxRateToSgd,
        incoterm: incoterm || null,
        namedPlace: namedPlace || null,
        deliveryMethod: deliveryMethod || null,
        paymentMethod: paymentMethod || null,
        inspectionDays: inspectionDays ? Number(inspectionDays) : null,
        governingLaw: governingLaw || null,
        arbitrationRules: arbitrationRules || null,
        contractNo: contractNo || null,
        language,
        notes: notes || null,
      },
      lines: lines.map((line) => ({
        productId: line.productId,
        descriptionOverride: line.descriptionOverride || null,
        quantity: Number(line.quantity),
        uom: line.uom || null,
        unitPrice: line.unitPrice,
        discountPct: line.discountPct || null,
        netWeightKg: netWeights[line.key] || null,
      })),
    };
  }

  async function handleSave() {
    setPending(true);
    setError(undefined);

    const payload = buildPayload();
    const result =
      mode === "create"
        ? await createPurchaseOrderAction(payload)
        : await updatePurchaseOrderAction(purchaseOrderId!, payload);

    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }

    // Editing pushes to the same URL the user is already on — router.push to
    // an unchanged URL doesn't remount this component, so pending must be
    // reset explicitly rather than relying on navigation to do it (same bug
    // fixed in quotation-builder.tsx / sales-order-builder.tsx this session).
    router.push(`/purchase-orders/${result.id}`);
    router.refresh();
    setPending(false);
  }

  async function handleStatusChange(newStatus: (typeof STATUSES)[number]) {
    setPending(true);
    setError(undefined);

    const result = await updatePurchaseOrderStatusAction(
      purchaseOrderId!,
      newStatus,
    );
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    router.refresh();
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {mode === "edit" ? (
        <div className="flex flex-wrap items-center gap-3">
          {STATUSES.map((s) => (
            <Button
              key={s}
              type="button"
              variant={s === status ? "default" : "outline"}
              size="sm"
              disabled={pending || s === status}
              onClick={() => handleStatusChange(s)}
              className="capitalize"
            >
              {s.replace("_", " ")}
            </Button>
          ))}
        </div>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="legalEntityId">Legal entity (buyer)</Label>
              <Select
                value={legalEntityId}
                onValueChange={(v) => setLegalEntityId(v ?? "")}
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="projectId">Project</Label>
              <Select
                value={projectId}
                onValueChange={(v) => setProjectId(v ?? "")}
                items={projects.map((p) => ({
                  value: p.id,
                  label: p.nameEn,
                }))}
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
              <Label htmlFor="contractNo">Contract no.</Label>
              <Input
                id="contractNo"
                value={contractNo}
                onChange={(e) => setContractNo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Supplier</Label>
            <Segmented
              value={supplierType}
              onValueChange={(v) =>
                setSupplierType((v as "company" | "legalEntity") ?? "company")
              }
            >
              <SegmentedItem value="company">External company</SegmentedItem>
              <SegmentedItem value="legalEntity">
                Our own legal entity
              </SegmentedItem>
            </Segmented>
            {supplierType === "company" ? (
              <Select
                value={supplierCompanyId}
                onValueChange={(v) => setSupplierCompanyId(v ?? "")}
                items={companies.map((c) => ({
                  value: c.id,
                  label: c.nameEn,
                }))}
              >
                <SelectTrigger>
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
            ) : (
              <Select
                value={supplierLegalEntityId}
                onValueChange={(v) => setSupplierLegalEntityId(v ?? "")}
                items={legalEntities.map((le) => ({
                  value: le.id,
                  label: `${le.nameEn} (${le.shortCode})`,
                }))}
              >
                <SelectTrigger>
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
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="linkedSalesOrderId">
              Linked sales order (back-to-back)
            </Label>
            <Select
              value={linkedSalesOrderId || "none"}
              onValueChange={(v) =>
                setLinkedSalesOrderId(v === "none" || !v ? "" : v)
              }
              items={[
                { value: "none", label: "None" },
                ...salesOrders.map((so) => ({
                  value: so.id,
                  label: so.orderNo,
                })),
              ]}
            >
              <SelectTrigger id="linkedSalesOrderId">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {salesOrders.map((so) => (
                  <SelectItem key={so.id} value={so.id}>
                    {so.orderNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="deliveryLocation">Delivery location</Label>
              <Input
                id="deliveryLocation"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="requiredDeliveryDate">
                Required delivery date
              </Label>
              <Input
                id="requiredDeliveryDate"
                type="date"
                value={requiredDeliveryDate}
                onChange={(e) => setRequiredDeliveryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="signedDate">Signed date</Label>
              <Input
                id="signedDate"
                type="date"
                value={signedDate}
                onChange={(e) => setSignedDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                maxLength={3}
                className="uppercase"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fxRateToSgd">FX rate to SGD</Label>
              <Input
                id="fxRateToSgd"
                inputMode="decimal"
                placeholder="1.000000"
                value={fxRateToSgd}
                onChange={(e) => setFxRateToSgd(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="incoterm">Incoterm</Label>
              <Select
                value={incoterm || "none"}
                onValueChange={(v) => setIncoterm(v === "none" || !v ? "" : v)}
                items={[
                  { value: "none", label: "Unspecified" },
                  ...INCOTERMS.map((i) => ({ value: i, label: i })),
                ]}
              >
                <SelectTrigger id="incoterm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unspecified</SelectItem>
                  {INCOTERMS.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="namedPlace">Named place</Label>
              <Input
                id="namedPlace"
                value={namedPlace}
                onChange={(e) => setNamedPlace(e.target.value)}
                disabled={incoterm === "" || incoterm === "EXW"}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="governingLaw">Governing law</Label>
              <Input
                id="governingLaw"
                value={governingLaw}
                onChange={(e) => setGoverningLaw(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="arbitrationRules">Arbitration rules</Label>
              <Input
                id="arbitrationRules"
                placeholder="e.g. SIAC, HKIAC"
                value={arbitrationRules}
                onChange={(e) => setArbitrationRules(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="deliveryMethod">Delivery method</Label>
              <Input
                id="deliveryMethod"
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="paymentMethod">Payment method</Label>
              <Input
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inspectionDays">
                Inspection window (working days)
              </Label>
              <Input
                id="inspectionDays"
                type="number"
                min={1}
                value={inspectionDays}
                onChange={(e) => setInspectionDays(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={language}
                onValueChange={(v) => setLanguage(v ?? "en")}
                items={LANGUAGES}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <OrderLineEditor
            lines={lines}
            onLinesChange={setLines}
            currency={currency}
            products={products}
          />

          <div className="flex flex-col gap-2">
            <Label>Net weight per line (kg) — optional</Label>
            {lines.map((line) => {
              const product = products.find((p) => p.id === line.productId);
              return (
                <div key={line.key} className="flex items-center gap-3">
                  <span className="w-56 truncate text-sm text-muted-foreground">
                    {product
                      ? `${product.centorCode} — ${product.nameEn}`
                      : "—"}
                  </span>
                  <Input
                    className="w-32"
                    inputMode="decimal"
                    placeholder="0.000"
                    value={netWeights[line.key] ?? ""}
                    onChange={(e) =>
                      setNetWeights((prev) => ({
                        ...prev,
                        [line.key]: e.target.value,
                      }))
                    }
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          disabled={pending}
          onClick={handleSave}
          className="w-fit"
        >
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create purchase order"
              : "Save changes"}
        </Button>
        {mode === "edit" && purchaseOrderId ? (
          <a
            href={`/purchase-orders/${purchaseOrderId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "ghost" })}
          >
            Export PDF
          </a>
        ) : null}
      </div>

      {mode === "edit" && orderNo ? (
        <p className="text-sm text-muted-foreground">{orderNo}</p>
      ) : null}
    </div>
  );
}
