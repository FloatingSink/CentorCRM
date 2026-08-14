import Link from "next/link";
import { notFound } from "next/navigation";

import { PurchaseOrderBuilder } from "../purchase-order-builder";
import { ActivityTimeline } from "@/components/activity-timeline";
import { DocumentLibrary } from "@/components/document-library";
import { Badge } from "@/components/ui/badge";
import { getActivitiesForRelated } from "@/server/activities";
import { getCompanies } from "@/server/companies";
import { getDocumentsForRelated } from "@/server/documents";
import { getLegalEntities } from "@/server/legal-entities";
import { getProducts } from "@/server/products";
import { getProjects } from "@/server/projects";
import { getSalesOrderById, getSalesOrders } from "@/server/sales-orders";
import { getPurchaseOrderById } from "@/server/purchase-orders";

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getPurchaseOrderById(id);
  if (!result) {
    notFound();
  }
  const { order, lines } = result;

  const [
    legalEntities,
    companies,
    projects,
    products,
    salesOrders,
    linked,
    activities,
    documents,
  ] = await Promise.all([
    getLegalEntities(),
    getCompanies(),
    getProjects(),
    getProducts(),
    getSalesOrders(),
    order.linkedSalesOrderId
      ? getSalesOrderById(order.linkedSalesOrderId)
      : Promise.resolve(null),
    getActivitiesForRelated("purchase_order", order.id),
    getDocumentsForRelated("purchase_order", order.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl">{order.orderNo}</h2>
        {linked ? (
          <Link href={`/sales-orders/${linked.order.id}`}>
            <Badge variant="outline">
              Linked to sales order {linked.order.orderNo}
            </Badge>
          </Link>
        ) : null}
      </div>
      <PurchaseOrderBuilder
        mode="edit"
        purchaseOrderId={order.id}
        orderNo={order.orderNo}
        status={order.status}
        legalEntities={legalEntities}
        companies={companies}
        projects={projects}
        products={products}
        salesOrders={salesOrders.map((so) => ({
          id: so.id,
          orderNo: so.orderNo,
        }))}
        documents={documents}
        defaultHeader={{
          legalEntityId: order.legalEntityId,
          supplierCompanyId: order.supplierCompanyId,
          supplierLegalEntityId: order.supplierLegalEntityId,
          projectId: order.projectId,
          linkedSalesOrderId: order.linkedSalesOrderId,
          signedDate: order.signedDate,
          deliveryLocation: order.deliveryLocation,
          requiredDeliveryDate: order.requiredDeliveryDate,
          currency: order.currency,
          fxRateToSgd: order.fxRateToSgd,
          incoterm: order.incoterm,
          namedPlace: order.namedPlace,
          deliveryMethod: order.deliveryMethod,
          paymentMethod: order.paymentMethod,
          inspectionDays: order.inspectionDays,
          governingLaw: order.governingLaw,
          arbitrationRules: order.arbitrationRules,
          contractNo: order.contractNo,
          executedDocumentId: order.executedDocumentId,
          language: order.language,
          notes: order.notes,
        }}
        defaultLines={lines.map((l) => ({
          productId: l.productId,
          descriptionOverride: l.descriptionOverride,
          quantity: l.quantity,
          uom: l.uom,
          unitPrice: l.unitPrice,
          discountPct: l.discountPct,
          netWeightKg: l.netWeightKg,
        }))}
      />

      <DocumentLibrary
        relatedType="purchase_order"
        relatedId={order.id}
        documents={documents}
      />

      <ActivityTimeline
        relatedType="purchase_order"
        relatedId={order.id}
        activities={activities}
      />
    </div>
  );
}
