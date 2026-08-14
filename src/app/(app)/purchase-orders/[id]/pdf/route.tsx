import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { PurchaseOrderDocument } from "@/lib/pdf/purchase-order-document";
import { getPurchaseOrderForPdf } from "@/server/purchase-orders";

// Route handlers aren't covered by the (app) layout's auth() redirect — see
// quotations/[id]/pdf/route.tsx, the direct pattern this mirrors.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Not signed in", { status: 401 });
  }

  const { id } = await params;
  const data = await getPurchaseOrderForPdf(id);
  if (!data) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = await renderToBuffer(<PurchaseOrderDocument data={data} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${data.order.orderNo}.pdf"`,
    },
  });
}
