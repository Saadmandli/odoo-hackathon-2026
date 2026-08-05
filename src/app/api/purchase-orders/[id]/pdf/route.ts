import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { buildPurchaseOrderPdf } from "@/lib/po-pdf";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: { vendor: true, quotation: { include: { rfq: true, items: { include: { rfqItem: true } } } } },
    });
    if (!po) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    if (user.role === "SELLER" && po.vendorId !== user.vendorId)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const pdf = await buildPurchaseOrderPdf({
      poNumber: po.poNumber, rfqNumber: po.quotation.rfq.rfqNumber, rfqTitle: po.quotation.rfq.title,
      createdAt: po.createdAt,
      vendor: { name: po.vendor.name, email: po.vendor.email, gstNumber: po.vendor.gstNumber, address: po.vendor.address },
      lines: po.quotation.items.map((it) => ({ name: it.rfqItem.productName, quantity: it.quantity, unitPrice: it.unitPrice, amount: it.amount })),
      subtotal: po.subtotal, taxRate: po.taxRate, taxAmount: po.taxAmount, totalAmount: po.totalAmount, savings: po.savings,
    });
    const inline = new URL(req.url).searchParams.get("inline") === "1";
    return new NextResponse(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${po.poNumber}.pdf"` },
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
