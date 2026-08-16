import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { formatMoney } from "@/lib/money";
import type { getQuotationForPdf } from "@/server/quotations";
import { label } from "./labels";
import { letterheadImagePath } from "./letterhead";

// react-pdf's built-in fonts have no CJK glyphs — registered once at module
// scope, only actually fetched by react-pdf when a Chinese glyph is used
// (docs/decisions.md, 2026-08-12). Verified working direct TTF URL (not the
// CSS endpoint, which serves woff2 that fontkit can't always read).
Font.register({
  family: "Noto Sans SC",
  src: "https://fonts.gstatic.com/s/notosanssc/v40/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYw.ttf",
});

type QuotationData = NonNullable<
  Awaited<ReturnType<typeof getQuotationForPdf>>
>;

const styles = StyleSheet.create({
  page: {
    fontFamily: "Noto Sans SC",
    fontSize: 10,
    padding: 40,
    color: "#111",
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  // 826x224 source (public/logos/README.md) — height fixed, width auto so
  // react-pdf preserves the real aspect ratio instead of stretching it.
  letterhead: { height: 28, marginBottom: 6 },
  title: { fontSize: 18, marginBottom: 4 },
  muted: { color: "#555" },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 11, marginBottom: 4, fontWeight: 700 },
  table: { marginTop: 16 },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottom: "1px solid #333",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #ddd",
    paddingVertical: 4,
  },
  colProduct: { width: "22%" },
  colDescription: { width: "24%" },
  colQty: { width: "8%", textAlign: "right" },
  colUom: { width: "10%" },
  colUnitPrice: { width: "12%", textAlign: "right" },
  colDiscount: { width: "10%", textAlign: "right" },
  colLineTotal: { width: "14%", textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    paddingTop: 8,
    borderTop: "1px solid #333",
  },
  notes: { marginTop: 16, fontSize: 9, color: "#555" },
});

function pickName(nameEn: string, nameZh: string | null, language: string) {
  if (language === "en") return nameEn;
  if (language === "zh") return nameZh || nameEn;
  return nameZh ? `${nameEn} / ${nameZh}` : nameEn;
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toISOString().slice(0, 10);
}

export function QuotationDocument({ data }: { data: QuotationData }) {
  const { quotation, legalEntity, company, contact, lines } = data;
  const language = quotation.language;
  const L = (key: Parameters<typeof label>[0]) => label(key, language);
  const letterhead = letterheadImagePath(legalEntity.letterheadAsset);

  return (
    <Document
      title={quotation.quoteNo}
      language={language === "zh" ? "zh" : "en"}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.row}>
          <View>
            {letterhead ? (
              // react-pdf's Image is a PDF primitive, not an HTML <img> —
              // it has no alt prop; jsx-a11y can't tell the two apart.
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={letterhead} style={styles.letterhead} />
            ) : null}
            <Text style={styles.title}>
              {pickName(legalEntity.nameEn, legalEntity.nameZh, language)}
            </Text>
            {legalEntity.registeredAddress ? (
              <Text style={styles.muted}>{legalEntity.registeredAddress}</Text>
            ) : null}
            {legalEntity.registrationNo ? (
              <Text style={styles.muted}>
                {legalEntity.jurisdiction} · {legalEntity.registrationNo}
              </Text>
            ) : null}
          </View>
          <View>
            <Text style={styles.title}>{L("quotation")}</Text>
            <Text>
              {L("quoteNo")}: {quotation.quoteNo}
            </Text>
            <Text style={styles.muted}>
              {L("version")}: {quotation.version}
            </Text>
          </View>
        </View>

        <View style={[styles.row, styles.section]}>
          <View>
            <Text style={styles.sectionTitle}>{L("customer")}</Text>
            <Text>{pickName(company.nameEn, company.nameZh, language)}</Text>
            {company.address ? (
              <Text style={styles.muted}>{company.address}</Text>
            ) : null}
            {contact ? (
              <Text style={styles.muted}>
                {L("attn")}:{" "}
                {pickName(contact.nameEn, contact.nameZh, language)}
                {contact.email ? ` · ${contact.email}` : ""}
                {contact.phone ? ` · ${contact.phone}` : ""}
              </Text>
            ) : null}
          </View>
          <View>
            <Text>
              {L("issueDate")}: {formatDate(quotation.issueDate)}
            </Text>
            <Text>
              {L("validUntil")}: {formatDate(quotation.validUntil)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {L("incoterm")}
            {quotation.incoterm ? `: ${quotation.incoterm}` : ": —"}
            {quotation.namedPlace
              ? ` (${L("namedPlace")}: ${quotation.namedPlace})`
              : ""}
          </Text>
          {quotation.paymentTerms ? (
            <Text>
              {L("paymentTerms")}: {quotation.paymentTerms}
            </Text>
          ) : null}
          {quotation.leadTimeDays !== null ? (
            <Text>
              {L("leadTime")}: {quotation.leadTimeDays}
            </Text>
          ) : null}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colProduct}>{L("product")}</Text>
            <Text style={styles.colDescription}>{L("description")}</Text>
            <Text style={styles.colQty}>{L("qty")}</Text>
            <Text style={styles.colUom}>{L("uom")}</Text>
            <Text style={styles.colUnitPrice}>{L("unitPrice")}</Text>
            <Text style={styles.colDiscount}>{L("discount")}</Text>
            <Text style={styles.colLineTotal}>{L("lineTotal")}</Text>
          </View>
          {lines.map(({ line, product }) => (
            <View key={line.id} style={styles.tableRow}>
              <Text style={styles.colProduct}>
                {product.centorCode} —{" "}
                {pickName(product.nameEn, product.nameZh, language)}
              </Text>
              <Text style={styles.colDescription}>
                {line.descriptionOverride ?? ""}
              </Text>
              <Text style={styles.colQty}>{line.quantity}</Text>
              <Text style={styles.colUom}>{line.uom ?? ""}</Text>
              <Text style={styles.colUnitPrice}>
                {formatMoney(line.unitPrice, quotation.currency)}
              </Text>
              <Text style={styles.colDiscount}>
                {line.discountPct ? `${line.discountPct}%` : "—"}
              </Text>
              <Text style={styles.colLineTotal}>
                {formatMoney(line.lineTotal, quotation.currency)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={{ fontWeight: 700 }}>
            {L("total")}:{" "}
            {formatMoney(
              lines.reduce((sum, l) => sum + l.line.lineTotal, 0),
              quotation.currency,
            )}
          </Text>
        </View>

        {quotation.notes ? (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>{L("notes")}</Text>
            <Text>{quotation.notes}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
