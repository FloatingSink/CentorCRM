import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { rmbAmountToCapitalWords } from "@/lib/chinese-numerals";
import { formatMoney } from "@/lib/money";
import type { getPurchaseOrderForPdf } from "@/server/purchase-orders";
import { label } from "./labels";
import { letterheadImagePath } from "./letterhead";
import { registerCjkFont } from "./register-cjk-font";

// Same registration as quotation-document.tsx — react-pdf's built-in fonts
// have no CJK glyphs. Font registries are per-module-graph (see
// docs/decisions.md, 2026-08-12's dynamic-import pitfall), so this must be a
// static import wherever this component is rendered.
registerCjkFont();

// react-pdf's default hyphenation engine is built for Latin-script "words"
// and would insert a literal "-" wherever it wraps a long word — kept
// disabled defensively, though the actual CJK line-wrapping fix is
// cjkWrap() below (see its comment): react-pdf's word-splitter only
// recognizes a literal ASCII space as a break point, not Chinese
// punctuation, so long unspaced Chinese sentences need real spaces
// inserted or they get hyphenated (or, observed here, silently clipped)
// instead of wrapping.
Font.registerHyphenationCallback((word) => [word]);

type PurchaseOrderData = NonNullable<
  Awaited<ReturnType<typeof getPurchaseOrderForPdf>>
>;

const styles = StyleSheet.create({
  page: {
    fontFamily: "Noto Sans SC",
    fontSize: 10,
    padding: 40,
    color: "#111",
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  // Same source/reasoning as quotation-document.tsx's letterhead style.
  letterhead: { height: 28, marginBottom: 6 },
  title: { fontSize: 18, marginBottom: 4 },
  muted: { color: "#555" },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 11, marginBottom: 4, fontWeight: 700 },
  table: { marginTop: 16, fontSize: 9 },
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
  // CNY's "CN¥" prefix (Intl.NumberFormat) is wider than "$"/"S$" — these
  // widths and the paddingRight on every column (so adjacent cells never
  // visually touch) were sized against that, not just USD/SGD.
  colProduct: { width: "20%", paddingRight: 4 },
  colDescription: { width: "15%", paddingRight: 4 },
  colQty: { width: "7%", textAlign: "right", paddingRight: 4 },
  colUom: { width: "8%", paddingRight: 4 },
  colUnitPrice: { width: "13%", textAlign: "right", paddingRight: 4 },
  colDiscount: { width: "8%", textAlign: "right", paddingRight: 4 },
  colLineTotal: { width: "15%", textAlign: "right", paddingRight: 4 },
  colNetWeight: { width: "14%", textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    paddingTop: 8,
    borderTop: "1px solid #333",
  },
  wordsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 2 },
  clauseBlock: { marginTop: 6 },
  clauseLine: { lineHeight: 1.4 },
  signatureBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  signatureColumn: { width: "45%" },
  signatureLine: { marginTop: 18, borderBottom: "1px solid #333", height: 1 },
  signatureLabel: { marginTop: 4, color: "#555", fontSize: 9 },
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

// react-pdf's line-breaker only splits on a literal ASCII space
// (@react-pdf/textkit splits words on /([ ]+)/g — confirmed by reading its
// source) and has no awareness of Chinese punctuation as a break
// opportunity. Without any spaces, an entire unbroken Chinese sentence is
// one "word" to it: too long to fit a line, it either gets hyphenated with
// a nonsensical "-" or silently clipped rather than wrapped (observed both
// ways while building this template). Inserting a real space after natural
// CJK punctuation gives it valid break points, same practical workaround
// used elsewhere for CJK text in non-CJK-aware line-breaking engines.
function cjkWrap(text: string): string {
  return text.replace(/([，。；：、])/g, "$1 ");
}

// Fixed contract-terms boilerplate from a real, previously-used CENTOR
// purchase order. Chinese text is verbatim from that source document, with
// one adaptation: the original packaging clause named a specific pack size
// (250kg drums) that was particular to that one order — generalized here to
// reference the line-item table instead, so this doesn't silently assert a
// wrong pack size on a future order using different packaging. English
// translations are intentionally left as a pending placeholder rather than
// invented — Jia Long will supply reviewed text for these (see the plan /
// docs/decisions.md).
const EN_PENDING = "[English translation pending]";

// Returns one string per line to render — react-pdf's <Text> doesn't treat
// an embedded "\n" as a real line break the way HTML does, so a bilingual
// clause must be two separate <Text> elements, not one string joined with
// "\n" (that silently truncated the longest clause instead of wrapping it).
function fixedClauseLines(zh: string, language: string): string[] {
  if (language === "en") return [EN_PENDING];
  if (language === "bilingual") return [cjkWrap(zh), EN_PENDING];
  return [cjkWrap(zh)];
}

const CLAUSE_QUALITY_ZH =
  "产品质量标准：供应方须提供本批产品的质量合格证（COA）及产品技术数据表（TDS），产品质量应符合双方确认的技术规格。";
const CLAUSE_PACKAGING_ZH =
  "包装要求：采用标准工业包装，密封良好，标识清晰，适于长途运输及仓储，包装规格以上表产品明细为准。";
const CLAUSE_BREACH_ZH =
  "违约责任：任何一方未能按本订单约定履行义务的，应承担相应违约责任，并赔偿由此给对方造成的直接经济损失。";
const CLAUSE_OTHER_ZH =
  "其他约定：本订单未尽事宜，由双方另行协商解决，并以书面形式作为本订单的补充条款。";

export function PurchaseOrderDocument({ data }: { data: PurchaseOrderData }) {
  const { order, legalEntity, supplierCompany, supplierLegalEntity, lines } =
    data;
  const language = order.language;
  const L = (key: Parameters<typeof label>[0]) => label(key, language);

  const supplierName = supplierCompany
    ? pickName(supplierCompany.nameEn, supplierCompany.nameZh, language)
    : supplierLegalEntity
      ? pickName(
          supplierLegalEntity.nameEn,
          supplierLegalEntity.nameZh,
          language,
        )
      : "—";
  const supplierAddress = supplierCompany
    ? supplierCompany.address
    : supplierLegalEntity?.registeredAddress;

  const totalMinor = lines.reduce((sum, l) => sum + l.line.lineTotal, 0);

  // Delivery/payment method are just a translated label + whatever the user
  // typed — real data, not fixed legal prose, so no EN-pending treatment.
  const deliveryMethodText = cjkWrap(
    `${L("deliveryMethod")}：${order.deliveryMethod ?? "［ ］"}`,
  );
  const paymentMethodText = cjkWrap(
    `${L("paymentMethod")}：${order.paymentMethod ?? "［ ］"}`,
  );

  // Acceptance/inspection mixes a real number (inspectionDays, user data)
  // with dense fixed legal prose (rejection/replacement terms) — the number
  // stays visible in every language; the fixed prose gets the same
  // EN-pending treatment as the other boilerplate clauses.
  const inspectionDaysText =
    order.inspectionDays !== null ? String(order.inspectionDays) : "［ ］";
  const inspectionZh = cjkWrap(
    `验收方式：货物到达指定地点后，由采购方（甲方）在${inspectionDaysText}个工作日内完成验收；如产品数量、规格或质量与本订单不符，供应方须无条件退换。`,
  );
  const inspectionEn = `${L("acceptance")}: within ${inspectionDaysText} working days of arrival. ${EN_PENDING}`;
  const inspectionLines =
    language === "zh"
      ? [inspectionZh]
      : language === "bilingual"
        ? [inspectionZh, inspectionEn]
        : [inspectionEn];

  // legalEntity is the buyer — the one of our own entities issuing this
  // order — so its letterhead is what belongs here, never the supplier's.
  const letterhead = letterheadImagePath(legalEntity.letterheadAsset);

  return (
    <Document title={order.orderNo} language={language === "zh" ? "zh" : "en"}>
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
              <Text style={styles.muted}>
                {cjkWrap(legalEntity.registeredAddress)}
              </Text>
            ) : null}
            {legalEntity.registrationNo ? (
              <Text style={styles.muted}>
                {legalEntity.jurisdiction} · {legalEntity.registrationNo}
              </Text>
            ) : null}
          </View>
          <View>
            <Text style={styles.title}>{L("purchaseOrder")}</Text>
            <Text>
              {L("orderNo")}: {order.orderNo}
            </Text>
            {order.contractNo ? (
              <Text style={styles.muted}>
                {L("contractNo")}: {order.contractNo}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={[styles.row, styles.section]}>
          <View>
            <Text style={styles.sectionTitle}>{L("buyer")}</Text>
            <Text>
              {pickName(legalEntity.nameEn, legalEntity.nameZh, language)}
            </Text>
          </View>
          <View>
            <Text style={styles.sectionTitle}>{L("supplier")}</Text>
            <Text>{supplierName}</Text>
            {supplierAddress ? (
              <Text style={styles.muted}>{cjkWrap(supplierAddress)}</Text>
            ) : null}
          </View>
        </View>

        <View style={[styles.row, styles.section]}>
          <Text>
            {L("signedDate")}: {formatDate(order.signedDate)}
          </Text>
          <Text>
            {L("deliveryLocation")}: {order.deliveryLocation ?? "—"}
          </Text>
          <Text>
            {L("requiredDeliveryDate")}:{" "}
            {formatDate(order.requiredDeliveryDate)}
          </Text>
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
            <Text style={styles.colNetWeight}>{L("netWeight")}</Text>
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
                {formatMoney(line.unitPrice, order.currency)}
              </Text>
              <Text style={styles.colDiscount}>
                {line.discountPct ? `${line.discountPct}%` : "—"}
              </Text>
              <Text style={styles.colLineTotal}>
                {formatMoney(line.lineTotal, order.currency)}
              </Text>
              <Text style={styles.colNetWeight}>
                {line.netWeightKg ? `${line.netWeightKg} kg` : "—"}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={{ fontWeight: 700 }}>
            {L("total")}: {formatMoney(totalMinor, order.currency)}
          </Text>
        </View>
        {order.currency === "CNY" ? (
          <View style={styles.wordsRow}>
            <Text style={styles.muted}>
              {L("totalInWords")}: {rmbAmountToCapitalWords(totalMinor)}
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{L("contractTerms")}</Text>
          {[
            fixedClauseLines(CLAUSE_QUALITY_ZH, language),
            fixedClauseLines(CLAUSE_PACKAGING_ZH, language),
            [deliveryMethodText],
            [paymentMethodText],
            inspectionLines,
            fixedClauseLines(CLAUSE_BREACH_ZH, language),
            fixedClauseLines(CLAUSE_OTHER_ZH, language),
          ].map((clauseLines, i) => (
            <View key={i} style={styles.clauseBlock}>
              {clauseLines.map((line, j) => (
                <Text key={j} style={styles.clauseLine}>
                  {line}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {order.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{L("notes")}</Text>
            <Text>{cjkWrap(order.notes)}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{L("signatureSection")}</Text>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureColumn}>
              <Text>
                {L("buyer")}:{" "}
                {pickName(legalEntity.nameEn, legalEntity.nameZh, language)}
              </Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>
                {L("authorizedSignatory")}
              </Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>{L("title")}</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>{L("date")}</Text>
              <Text style={[styles.signatureLabel, { marginTop: 12 }]}>
                {L("companyChop")}
              </Text>
            </View>
            <View style={styles.signatureColumn}>
              <Text>
                {L("supplier")}: {supplierName}
              </Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>
                {L("authorizedSignatory")}
              </Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>{L("title")}</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>{L("date")}</Text>
              <Text style={[styles.signatureLabel, { marginTop: 12 }]}>
                {L("companyChop")}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
