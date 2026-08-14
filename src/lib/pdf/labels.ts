// Standard commercial-document terms, not company-specific data — same kind
// of call already made for enum labels elsewhere (e.g. STAGES in
// opportunity-form.tsx). Chinese quotation.language: en | zh | bilingual.
const LABELS = {
  quotation: { en: "Quotation", zh: "报价单" },
  quoteNo: { en: "Quote No.", zh: "报价单号" },
  version: { en: "Version", zh: "版本" },
  issueDate: { en: "Issue Date", zh: "签发日期" },
  validUntil: { en: "Valid Until", zh: "有效期至" },
  customer: { en: "Customer", zh: "客户" },
  attn: { en: "Attn", zh: "联系人" },
  incoterm: { en: "Incoterm", zh: "贸易条款" },
  namedPlace: { en: "Named Place", zh: "指定地点" },
  paymentTerms: { en: "Payment Terms", zh: "付款条件" },
  leadTime: { en: "Lead Time (days)", zh: "交货期（天）" },
  product: { en: "Product", zh: "产品" },
  description: { en: "Description", zh: "描述" },
  qty: { en: "Qty", zh: "数量" },
  uom: { en: "UOM", zh: "单位" },
  unitPrice: { en: "Unit Price", zh: "单价" },
  discount: { en: "Discount", zh: "折扣" },
  lineTotal: { en: "Line Total", zh: "小计" },
  total: { en: "Total", zh: "总计" },
  notes: { en: "Notes", zh: "备注" },
  purchaseOrder: { en: "Purchase Order", zh: "采购订单" },
  orderNo: { en: "PO No.", zh: "采购单编号" },
  contractNo: { en: "Contract No.", zh: "合同编号" },
  signedDate: { en: "Signed Date", zh: "签订日期" },
  buyer: { en: "Buyer", zh: "采购方（甲方）" },
  supplier: { en: "Supplier", zh: "供应方（乙方）" },
  deliveryLocation: { en: "Delivery Location", zh: "交货地点" },
  requiredDeliveryDate: { en: "Required Delivery Date", zh: "要求交货日期" },
  deliveryMethod: { en: "Delivery Method", zh: "交货方式" },
  paymentMethod: { en: "Payment Method", zh: "付款方式" },
  netWeight: { en: "Net Weight", zh: "净重" },
  acceptance: { en: "Acceptance", zh: "验收方式" },
  totalInWords: { en: "Amount in Words", zh: "人民币（大写）" },
  contractTerms: { en: "Terms & Conditions", zh: "交易条款" },
  signatureSection: { en: "Signatures", zh: "签署确认" },
  authorizedSignatory: { en: "Authorized Signatory", zh: "授权代表签字" },
  title: { en: "Title", zh: "职务" },
  date: { en: "Date", zh: "日期" },
  companyChop: { en: "(Company Chop)", zh: "（公司盖章）" },
} as const;

export type LabelKey = keyof typeof LABELS;

export function label(key: LabelKey, language: string): string {
  const entry = LABELS[key];
  if (language === "zh") return entry.zh;
  if (language === "bilingual") return `${entry.en} / ${entry.zh}`;
  return entry.en;
}
