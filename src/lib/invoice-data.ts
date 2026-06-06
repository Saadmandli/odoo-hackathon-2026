import { prisma } from "./prisma";
import type { InvoiceData } from "./pdf";

export async function loadInvoiceData(invoiceId: string): Promise<InvoiceData | null> {
  const inv = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      purchaseOrder: {
        include: {
          vendor: true,
          quotation: { include: { rfq: true, items: { include: { rfqItem: true } } } },
        },
      },
    },
  });
  if (!inv) return null;
  const po = inv.purchaseOrder;
  const lines = po.quotation.items.map((it) => ({
    name: it.rfqItem.productName, quantity: it.quantity, unitPrice: it.unitPrice, amount: it.amount,
  }));
  return {
    invoiceNumber: inv.invoiceNumber,
    poNumber: po.poNumber,
    rfqTitle: po.quotation.rfq.title,
    createdAt: inv.createdAt,
    vendor: { name: po.vendor.name, email: po.vendor.email, gstNumber: po.vendor.gstNumber, address: po.vendor.address },
    lines, subtotal: inv.subtotal, taxRate: inv.taxRate, taxAmount: inv.taxAmount, totalAmount: inv.totalAmount,
  };
}
