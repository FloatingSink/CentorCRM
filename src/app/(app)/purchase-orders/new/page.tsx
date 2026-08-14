import { PurchaseOrderBuilder } from "../purchase-order-builder";
import { getCompanies } from "@/server/companies";
import { getLegalEntities } from "@/server/legal-entities";
import { getProducts } from "@/server/products";
import { getProjects } from "@/server/projects";
import { getSalesOrderById, getSalesOrders } from "@/server/sales-orders";

export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ linkedSalesOrderId?: string }>;
}) {
  const { linkedSalesOrderId } = await searchParams;

  const [legalEntities, companies, projects, products, salesOrders] =
    await Promise.all([
      getLegalEntities(),
      getCompanies(),
      getProjects(),
      getProducts(),
      getSalesOrders(),
    ]);

  let defaultProjectId = "";
  let defaultCurrency = "";
  let defaultLines:
    | {
        productId: string;
        descriptionOverride: string | null;
        quantity: number;
        uom: string | null;
        unitPrice: number;
        discountPct: string | null;
        netWeightKg: string | null;
      }[]
    | undefined;

  if (linkedSalesOrderId) {
    // Convenience for the back-to-back flow: pre-fill the project and copy
    // the linked sales order's line items in as an editable starting point
    // (same reasoning as the quotation -> sales-order copy in slice 1 — a
    // back-to-back leg usually moves the same products). Buyer legal entity
    // and supplier have no safe default to invent, so those stay blank.
    const linked = await getSalesOrderById(linkedSalesOrderId);
    if (linked) {
      defaultProjectId = linked.order.projectId;
      defaultCurrency = linked.order.currency;
      defaultLines = linked.lines.map((l) => ({
        productId: l.productId,
        descriptionOverride: l.descriptionOverride,
        quantity: l.quantity,
        uom: l.uom,
        unitPrice: l.unitPrice,
        discountPct: l.discountPct,
        // Not copied from the sales-order line — net weight is a
        // purchase-order-specific annotation the user fills in fresh.
        netWeightKg: null,
      }));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl">New purchase order</h2>
      <PurchaseOrderBuilder
        mode="create"
        legalEntities={legalEntities}
        companies={companies}
        projects={projects}
        products={products}
        salesOrders={salesOrders.map((so) => ({
          id: so.id,
          orderNo: so.orderNo,
        }))}
        defaultHeader={{
          legalEntityId: "",
          supplierCompanyId: null,
          supplierLegalEntityId: null,
          projectId: defaultProjectId,
          linkedSalesOrderId: linkedSalesOrderId ?? null,
          signedDate: null,
          deliveryLocation: null,
          requiredDeliveryDate: null,
          currency: defaultCurrency,
          fxRateToSgd: "1.000000",
          incoterm: null,
          namedPlace: null,
          deliveryMethod: null,
          paymentMethod: null,
          inspectionDays: null,
          governingLaw: null,
          arbitrationRules: null,
          contractNo: null,
          language: "en",
          notes: null,
        }}
        defaultLines={defaultLines}
      />
    </div>
  );
}
