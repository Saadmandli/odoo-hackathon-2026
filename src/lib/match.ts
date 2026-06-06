import { prisma } from "./prisma";

/** 3-way match: invoice clears only when PO totals == invoice totals AND goods fully received. */
export async function reconcileMatch(purchaseOrderId: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { invoice: true, goodsReceipt: { include: { items: true } } },
  });
  if (!po || !po.invoice) return "PENDING";
  const grn = po.goodsReceipt;
  const fullyReceived = !!grn && grn.items.every((i) => i.receivedQty === i.orderedQty);
  const amountsMatch = po.invoice.totalAmount === po.totalAmount;
  const status = !grn ? "PENDING" : fullyReceived && amountsMatch ? "MATCHED" : "MISMATCH";
  await prisma.invoice.update({ where: { id: po.invoice.id }, data: { matchStatus: status as any } });
  return status;
}
