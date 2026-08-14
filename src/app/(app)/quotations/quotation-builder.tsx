"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createQuotationAction,
  createQuotationVersionAction,
  updateQuotationAction,
  updateQuotationStatusAction,
} from "./actions";
import {
  emptyLine,
  lineRowsFromExisting,
  OrderLineEditor,
  type LineRow,
} from "@/components/order-line-editor";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";

const INCOTERMS = ["EXW", "FOB", "CFR", "CIF", "DAP"] as const;
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "zh", label: "Chinese" },
  { value: "bilingual", label: "Bilingual" },
] as const;
const STATUSES = ["draft", "sent", "accepted", "rejected"] as const;

type Opportunity = {
  id: string;
  reference: string;
  title: string;
  customerCompanyId: string;
  legalEntityId: string;
  currency: string | null;
};

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function QuotationBuilder({
  mode,
  quotationId,
  quoteNo,
  version,
  status,
  opportunities,
  legalEntities,
  companies,
  contacts,
  products,
  defaultHeader,
  defaultLines,
}: {
  mode: "create" | "edit";
  quotationId?: string;
  quoteNo?: string;
  version?: number;
  status?: string;
  opportunities: Opportunity[];
  legalEntities: { id: string; nameEn: string; shortCode: string }[];
  companies: { id: string; nameEn: string }[];
  contacts: { id: string; nameEn: string; companyId: string }[];
  products: { id: string; centorCode: string; nameEn: string }[];
  defaultHeader?: {
    opportunityId: string;
    legalEntityId: string;
    customerCompanyId: string;
    contactId: string | null;
    issueDate: Date;
    validUntil: Date | null;
    currency: string;
    incoterm: string | null;
    namedPlace: string | null;
    paymentTerms: string | null;
    leadTimeDays: number | null;
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
  }[];
}) {
  const router = useRouter();
  const [opportunityId, setOpportunityId] = useState(
    defaultHeader?.opportunityId ?? "",
  );
  const [legalEntityId, setLegalEntityId] = useState(
    defaultHeader?.legalEntityId ??
      legalEntities.find((le) => le.shortCode === "CGPL")?.id ??
      "",
  );
  const [customerCompanyId, setCustomerCompanyId] = useState(
    defaultHeader?.customerCompanyId ?? "",
  );
  const [contactId, setContactId] = useState(defaultHeader?.contactId ?? "");
  const [issueDate, setIssueDate] = useState(
    toDateInputValue(defaultHeader?.issueDate ?? new Date()),
  );
  const [validUntil, setValidUntil] = useState(
    toDateInputValue(defaultHeader?.validUntil ?? null),
  );
  const [currency, setCurrency] = useState(defaultHeader?.currency ?? "SGD");
  const [incoterm, setIncoterm] = useState(defaultHeader?.incoterm ?? "");
  const [namedPlace, setNamedPlace] = useState(defaultHeader?.namedPlace ?? "");
  const [paymentTerms, setPaymentTerms] = useState(
    defaultHeader?.paymentTerms ?? "",
  );
  const [leadTimeDays, setLeadTimeDays] = useState(
    defaultHeader?.leadTimeDays?.toString() ?? "",
  );
  const [language, setLanguage] = useState(defaultHeader?.language ?? "en");
  const [notes, setNotes] = useState(defaultHeader?.notes ?? "");

  const [lines, setLines] = useState<LineRow[]>(
    defaultLines ? lineRowsFromExisting(defaultLines) : [emptyLine()],
  );

  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  const contactsForCompany = contacts.filter(
    (c) => c.companyId === customerCompanyId,
  );

  function handleOpportunityChange(id: string | null) {
    setOpportunityId(id ?? "");
    const opp = opportunities.find((o) => o.id === id);
    if (opp) {
      setLegalEntityId(opp.legalEntityId);
      setCustomerCompanyId(opp.customerCompanyId);
      if (opp.currency) setCurrency(opp.currency);
    }
  }

  function buildPayload() {
    return {
      header: {
        opportunityId,
        legalEntityId,
        customerCompanyId,
        contactId: contactId || null,
        issueDate,
        validUntil: validUntil || null,
        currency,
        incoterm: incoterm || null,
        namedPlace: namedPlace || null,
        paymentTerms: paymentTerms || null,
        leadTimeDays: leadTimeDays ? Number(leadTimeDays) : null,
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
      })),
    };
  }

  async function handleSave() {
    setPending(true);
    setError(undefined);

    const payload = buildPayload();
    const result =
      mode === "create"
        ? await createQuotationAction(payload)
        : await updateQuotationAction(quotationId!, payload);

    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }

    // Editing pushes to the same URL the user is already on (result.id ===
    // quotationId for an update, unlike create/new-version which get a fresh
    // id) — router.push to an unchanged URL doesn't remount this component,
    // so pending must be reset explicitly rather than relying on navigation
    // to do it. Without this the button stays stuck on "Saving…" forever
    // even though the save itself succeeded.
    router.push(`/quotations/${result.id}`);
    router.refresh();
    setPending(false);
  }

  async function handleNewVersion() {
    setPending(true);
    setError(undefined);

    const result = await createQuotationVersionAction(
      quotationId!,
      buildPayload(),
    );
    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }

    // result.id is a genuinely new quotation here, so navigation normally
    // remounts and resets pending on its own — set explicitly anyway so this
    // doesn't silently break the same way handleSave did if that ever changes.
    router.push(`/quotations/${result.id}`);
    router.refresh();
    setPending(false);
  }

  async function handleStatusChange(newStatus: (typeof STATUSES)[number]) {
    setPending(true);
    setError(undefined);

    const result = await updateQuotationStatusAction(quotationId!, newStatus);
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
              {s}
            </Button>
          ))}
          {status === "superseded" ? (
            <Badge variant="secondary">Superseded</Badge>
          ) : null}
        </div>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-4">
          {mode === "create" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="opportunityId">Opportunity</Label>
              <Select
                value={opportunityId}
                onValueChange={handleOpportunityChange}
                items={opportunities.map((o) => ({
                  value: o.id,
                  label: `${o.reference} — ${o.title}`,
                }))}
              >
                <SelectTrigger id="opportunityId">
                  <SelectValue placeholder="Select an opportunity" />
                </SelectTrigger>
                <SelectContent>
                  {opportunities.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.reference} — {o.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

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
              <Label htmlFor="customerCompanyId">Customer</Label>
              <Select
                value={customerCompanyId}
                onValueChange={(v) => setCustomerCompanyId(v ?? "")}
                items={companies.map((c) => ({
                  value: c.id,
                  label: c.nameEn,
                }))}
              >
                <SelectTrigger id="customerCompanyId">
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="contactId">Contact</Label>
              <Select
                value={contactId || "none"}
                onValueChange={(v) => setContactId(v === "none" || !v ? "" : v)}
                items={[
                  { value: "none", label: "None" },
                  ...contactsForCompany.map((c) => ({
                    value: c.id,
                    label: c.nameEn,
                  })),
                ]}
              >
                <SelectTrigger id="contactId">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {contactsForCompany.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="issueDate">Issue date</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="validUntil">Valid until</Label>
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
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

          <div className="grid grid-cols-4 gap-4">
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
              <Label htmlFor="paymentTerms">Payment terms</Label>
              <Input
                id="paymentTerms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="leadTimeDays">Lead time (days)</Label>
              <Input
                id="leadTimeDays"
                type="number"
                min={0}
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
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

      <div className="flex gap-3">
        <Button type="button" disabled={pending} onClick={handleSave}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create quotation"
              : "Save changes"}
        </Button>
        {mode === "edit" ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={handleNewVersion}
          >
            Save as new version
          </Button>
        ) : null}
        {mode === "edit" ? (
          <a
            href={`/quotations/${quotationId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "ghost" })}
          >
            Export PDF
          </a>
        ) : null}
        {mode === "edit" && status === "accepted" ? (
          <a
            href={`/sales-orders/new?quotationId=${quotationId}`}
            className={buttonVariants({ variant: "ghost" })}
          >
            Convert to sales order
          </a>
        ) : null}
      </div>

      {mode === "edit" && quoteNo ? (
        <p className="text-sm text-muted-foreground">
          {quoteNo} · version {version}
        </p>
      ) : null}
    </div>
  );
}
