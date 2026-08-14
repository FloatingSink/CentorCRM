"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createSalesOrderAction,
  updateSalesOrderAction,
  updateSalesOrderStatusAction,
} from "./actions";
import {
  emptyLine,
  lineRowsFromExisting,
  OrderLineEditor,
  type LineRow,
} from "@/components/order-line-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export function SalesOrderBuilder({
  mode,
  salesOrderId,
  orderNo,
  status,
  quoteNo,
  legalEntities,
  companies,
  projects,
  products,
  documents,
  defaultHeader,
  defaultLines,
}: {
  mode: "create" | "edit";
  salesOrderId?: string;
  orderNo?: string;
  status?: string;
  quoteNo: string;
  legalEntities: { id: string; nameEn: string; shortCode: string }[];
  companies: { id: string; nameEn: string }[];
  projects: { id: string; nameEn: string }[];
  products: { id: string; centorCode: string; nameEn: string }[];
  documents: { id: string; title: string }[];
  defaultHeader: {
    quotationId: string;
    legalEntityId: string;
    customerCompanyId: string | null;
    customerLegalEntityId: string | null;
    projectId: string;
    signedDate: Date | null;
    currency: string;
    fxRateToSgd: string;
    incoterm: string | null;
    namedPlace: string | null;
    governingLaw: string | null;
    arbitrationRules: string | null;
    contractNo: string | null;
    executedDocumentId: string | null;
    notes: string | null;
  };
  defaultLines?: {
    productId: string;
    descriptionOverride: string | null;
    quantity: number;
    uom: string | null;
    unitPrice: number;
    discountPct: string | null;
  }[];
}) {
  const router = useRouter();
  const [legalEntityId, setLegalEntityId] = useState(
    defaultHeader.legalEntityId,
  );
  const [customerType, setCustomerType] = useState<"company" | "legalEntity">(
    defaultHeader.customerLegalEntityId ? "legalEntity" : "company",
  );
  const [customerCompanyId, setCustomerCompanyId] = useState(
    defaultHeader.customerCompanyId ?? "",
  );
  const [customerLegalEntityId, setCustomerLegalEntityId] = useState(
    defaultHeader.customerLegalEntityId ?? "",
  );
  const [projectId, setProjectId] = useState(defaultHeader.projectId);
  const [signedDate, setSignedDate] = useState(
    toDateInputValue(defaultHeader.signedDate),
  );
  const [currency, setCurrency] = useState(defaultHeader.currency);
  const [fxRateToSgd, setFxRateToSgd] = useState(defaultHeader.fxRateToSgd);
  const [incoterm, setIncoterm] = useState(defaultHeader.incoterm ?? "");
  const [namedPlace, setNamedPlace] = useState(defaultHeader.namedPlace ?? "");
  const [governingLaw, setGoverningLaw] = useState(
    defaultHeader.governingLaw ?? "",
  );
  const [arbitrationRules, setArbitrationRules] = useState(
    defaultHeader.arbitrationRules ?? "",
  );
  const [contractNo, setContractNo] = useState(defaultHeader.contractNo ?? "");
  const [executedDocumentId, setExecutedDocumentId] = useState(
    defaultHeader.executedDocumentId ?? "",
  );
  const [notes, setNotes] = useState(defaultHeader.notes ?? "");

  const [lines, setLines] = useState<LineRow[]>(
    defaultLines ? lineRowsFromExisting(defaultLines) : [emptyLine()],
  );

  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  function buildPayload() {
    return {
      header: {
        quotationId: defaultHeader.quotationId,
        legalEntityId,
        customerCompanyId:
          customerType === "company" ? customerCompanyId : null,
        customerLegalEntityId:
          customerType === "legalEntity" ? customerLegalEntityId : null,
        projectId,
        signedDate: signedDate || null,
        currency,
        fxRateToSgd,
        incoterm: incoterm || null,
        namedPlace: namedPlace || null,
        governingLaw: governingLaw || null,
        arbitrationRules: arbitrationRules || null,
        contractNo: contractNo || null,
        executedDocumentId: executedDocumentId || null,
        notes: notes || null,
      },
      lines: lines.map((line) => ({
        productId: line.productId,
        descriptionOverride: line.descriptionOverride || null,
        quantity: Number(line.quantity),
        uom: line.uom || null,
        unitPrice: line.unitPrice,
        discountPct: line.discountPct || null,
      })),
    };
  }

  async function handleSave() {
    setPending(true);
    setError(undefined);

    const payload = buildPayload();
    const result =
      mode === "create"
        ? await createSalesOrderAction(payload)
        : await updateSalesOrderAction(salesOrderId!, payload);

    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }

    // Editing pushes to the same URL the user is already on (result.id ===
    // salesOrderId for an update) — router.push to an unchanged URL doesn't
    // remount this component, so pending must be reset explicitly rather
    // than relying on navigation to do it (same bug as quotation-builder.tsx,
    // reported by Jia Long: button stuck on "Saving…" after an edit save).
    router.push(`/sales-orders/${result.id}`);
    router.refresh();
    setPending(false);
  }

  async function handleStatusChange(newStatus: (typeof STATUSES)[number]) {
    setPending(true);
    setError(undefined);

    const result = await updateSalesOrderStatusAction(salesOrderId!, newStatus);
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

      <p className="text-sm text-muted-foreground">
        From quotation <Badge variant="outline">{quoteNo}</Badge>
      </p>

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
              <Label htmlFor="legalEntityId">Legal entity</Label>
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
              <Label htmlFor="contractNo">Contract no.</Label>
              <Input
                id="contractNo"
                value={contractNo}
                onChange={(e) => setContractNo(e.target.value)}
              />
            </div>
          </div>

          {mode === "edit" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="executedDocumentId">Executed document</Label>
              <Select
                value={executedDocumentId || "none"}
                onValueChange={(v) =>
                  setExecutedDocumentId(v === "none" || !v ? "" : v)
                }
                items={[
                  { value: "none", label: "None" },
                  ...documents.map((d) => ({ value: d.id, label: d.title })),
                ]}
              >
                <SelectTrigger id="executedDocumentId">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {documents.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label>Customer</Label>
            <Segmented
              value={customerType}
              onValueChange={(v) =>
                setCustomerType((v as "company" | "legalEntity") ?? "company")
              }
            >
              <SegmentedItem value="company">External company</SegmentedItem>
              <SegmentedItem value="legalEntity">
                Our own legal entity
              </SegmentedItem>
            </Segmented>
            {customerType === "company" ? (
              <Select
                value={customerCompanyId}
                onValueChange={(v) => setCustomerCompanyId(v ?? "")}
                items={companies.map((c) => ({ value: c.id, label: c.nameEn }))}
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
                value={customerLegalEntityId}
                onValueChange={(v) => setCustomerLegalEntityId(v ?? "")}
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
        <CardContent>
          <OrderLineEditor
            lines={lines}
            onLinesChange={setLines}
            currency={currency}
            products={products}
          />
        </CardContent>
      </Card>

      <Button
        type="button"
        disabled={pending}
        onClick={handleSave}
        className="w-fit"
      >
        {pending
          ? "Saving…"
          : mode === "create"
            ? "Create sales order"
            : "Save changes"}
      </Button>

      {mode === "edit" && orderNo ? (
        <p className="text-sm text-muted-foreground">{orderNo}</p>
      ) : null}
    </div>
  );
}
