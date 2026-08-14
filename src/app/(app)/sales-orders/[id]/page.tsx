import Link from "next/link";
import { notFound } from "next/navigation";

import { SalesOrderBuilder } from "../sales-order-builder";
import { ActivityTimeline } from "@/components/activity-timeline";
import { DocumentLibrary } from "@/components/document-library";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { convertMinorToSgd, formatMoney } from "@/lib/money";
import { getActivitiesForRelated } from "@/server/activities";
import { getCompanies } from "@/server/companies";
import { getDocumentsForRelated } from "@/server/documents";
import { getLegalEntities } from "@/server/legal-entities";
import { getLinkedPurchaseOrders } from "@/server/purchase-orders";
import { getProducts } from "@/server/products";
import { getProjects } from "@/server/projects";
import { getQuotationById } from "@/server/quotations";
import { getSalesOrderById } from "@/server/sales-orders";

export default async function SalesOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getSalesOrderById(id);
  if (!result) {
    notFound();
  }
  const { order, lines } = result;
  const quotationResult = await getQuotationById(order.quotationId);

  const [
    legalEntities,
    companies,
    projects,
    products,
    linkedPurchaseOrders,
    activities,
    documents,
  ] = await Promise.all([
    getLegalEntities(),
    getCompanies(),
    getProjects(),
    getProducts(),
    getLinkedPurchaseOrders(order.id),
    getActivitiesForRelated("sales_order", order.id),
    getDocumentsForRelated("sales_order", order.id),
  ]);

  // Back-to-back margin roll-up (crm-spec.md §1, purpose #3) — both sides
  // converted to SGD via each document's own snapshot fx_rate_to_sgd before
  // comparing, since sales and purchase legs can be in different
  // currencies (crm-spec.md §7).
  const salesValueSgd = convertMinorToSgd(order.totalValue, order.fxRateToSgd);
  const purchaseValueSgd = linkedPurchaseOrders.reduce(
    (sum, po) => sum + convertMinorToSgd(po.totalValue, po.fxRateToSgd),
    0,
  );
  const marginSgd = salesValueSgd - purchaseValueSgd;
  const marginPct =
    salesValueSgd !== 0 ? (marginSgd / salesValueSgd) * 100 : null;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl">{order.orderNo}</h2>
      <SalesOrderBuilder
        mode="edit"
        salesOrderId={order.id}
        orderNo={order.orderNo}
        status={order.status}
        quoteNo={quotationResult?.quotation.quoteNo ?? "—"}
        legalEntities={legalEntities}
        companies={companies}
        projects={projects}
        products={products}
        documents={documents}
        defaultHeader={{
          quotationId: order.quotationId,
          legalEntityId: order.legalEntityId,
          customerCompanyId: order.customerCompanyId,
          customerLegalEntityId: order.customerLegalEntityId,
          projectId: order.projectId,
          signedDate: order.signedDate,
          currency: order.currency,
          fxRateToSgd: order.fxRateToSgd,
          incoterm: order.incoterm,
          namedPlace: order.namedPlace,
          governingLaw: order.governingLaw,
          arbitrationRules: order.arbitrationRules,
          contractNo: order.contractNo,
          executedDocumentId: order.executedDocumentId,
          notes: order.notes,
        }}
        defaultLines={lines.map((l) => ({
          productId: l.productId,
          descriptionOverride: l.descriptionOverride,
          quantity: l.quantity,
          uom: l.uom,
          unitPrice: l.unitPrice,
          discountPct: l.discountPct,
        }))}
      />

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg">Linked purchase orders &amp; margin</h3>
          <Link
            href={`/purchase-orders/new?linkedSalesOrderId=${order.id}`}
            className={buttonVariants()}
          >
            Create linked purchase order
          </Link>
        </div>
        {linkedPurchaseOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No linked purchase orders yet.
          </p>
        ) : (
          <Card className="py-4">
            <CardContent className="flex flex-col gap-4 px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Order No</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-4">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkedPurchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="pl-4 font-medium">
                        <Link
                          href={`/purchase-orders/${po.id}`}
                          className="hover:underline"
                        >
                          {po.orderNo}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {po.supplierCompanyId
                          ? po.supplierCompanyName
                          : `${po.supplierLegalEntityName} (ours)`}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {po.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-4">
                        {formatMoney(po.totalValue, po.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex flex-col gap-1 px-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Sales value (SGD)
                  </span>
                  <span>{formatMoney(salesValueSgd, "SGD")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Purchase value (SGD)
                  </span>
                  <span>−{formatMoney(purchaseValueSgd, "SGD")}</span>
                </div>
                <div className="flex justify-between font-heading text-base">
                  <span>Margin</span>
                  <span>
                    {formatMoney(marginSgd, "SGD")}
                    {marginPct !== null ? ` (${marginPct.toFixed(1)}%)` : ""}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <DocumentLibrary
        relatedType="sales_order"
        relatedId={order.id}
        documents={documents}
      />

      <ActivityTimeline
        relatedType="sales_order"
        relatedId={order.id}
        activities={activities}
      />
    </div>
  );
}
