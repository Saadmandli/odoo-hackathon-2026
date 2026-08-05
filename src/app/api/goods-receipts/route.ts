import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import { genNumber } from "@/lib/utils";
import { reconcileMatch } from "@/lib/match";

export async function GET() {
  try {
    await requireUser();
    const receipts = await prisma.goodsReceipt.findMany({
      orderBy: { createdAt: "desc" },
      include: { purchaseOrder: { include: { vendor: true } }, items: { include: { rfqItem: true } }, receivedBy: { select: { name: true } } },
    });
    return NextResponse.json({ receipts });
  } catch (e) { return err(e); }
}

// Record receipt of goods against a PO. Lines: [{ rfqItemId, receivedQty }]
export async function POST(req: Request) {
  try {
    const user = await requireUser(["BUYER", "ADMIN"]);
    const { purchaseOrderId, notes, lines } = await req.json();
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { goodsReceipt: true, quotation: { include: { items: { include: { rfqItem: true } } } } },
    });
    if (!po) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    if (po.goodsReceipt) return NextResponse.json({ error: "Goods already received for this PO" }, { status: 409 });

    const ordered = po.quotation.items.map((it) => ({ rfqItemId: it.rfqItemId, orderedQty: it.quantity }));
    const grnItems = ordered.map((o) => {
      const line = (lines || []).find((l: any) => l.rfqItemId === o.rfqItemId);
      const receivedQty = line ? Math.max(0, Math.min(Number(line.receivedQty), o.orderedQty)) : o.orderedQty;
      return { rfqItemId: o.rfqItemId, orderedQty: o.orderedQty, receivedQty };
    });
    const complete = grnItems.every((g) => g.receivedQty === g.orderedQty);

    const count = await prisma.goodsReceipt.count();
    const grnNumber = await genNumber("GRN", count);
    const grn = await prisma.goodsReceipt.create({
      data: { grnNumber, purchaseOrderId, receivedById: user.id, notes: notes || null, status: complete ? "COMPLETE" : "PARTIAL", items: { create: grnItems } },
    });
    await prisma.purchaseOrder.update({ where: { id: purchaseOrderId }, data: { status: complete ? "RECEIVED" : "ACKNOWLEDGED" } });
    const match = await reconcileMatch(purchaseOrderId);

    await logActivity({ userId: user.id, action: "RECEIVE", entityType: "GoodsReceipt", entityId: grn.id, message: `Goods received (${grn.grnNumber}) for PO ${po.poNumber} — ${complete ? "complete" : "partial"}; match ${match}` });
    return NextResponse.json({ grn, match }, { status: 201 });
  } catch (e) { return err(e); }
}

function err(e: unknown) {
  if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
}
