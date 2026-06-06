import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import RfqDetailClient from "./RfqDetailClient";

export default async function RfqDetail({ params }: { params: { id: string } }) {
  const user = (await getSession())!;
  const rfq = await prisma.rFQ.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true, email: true } },
      items: true,
      invitedVendors: { include: { vendor: true } },
      quotations: { include: { vendor: true, items: { include: { rfqItem: true } }, purchaseOrder: { include: { invoice: true } } }, orderBy: { totalAmount: "asc" } },
      approvals: { include: { approver: { select: { name: true } }, quotation: { include: { vendor: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!rfq) notFound();

  // Access control: a vendor can only open an RFQ they were invited to.
  if (user.role === "VENDOR" && !rfq.invitedVendors.some((iv) => iv.vendorId === user.vendorId)) notFound();

  const visibleQuotations =
    user.role === "VENDOR" ? rfq.quotations.filter((q) => q.vendorId === user.vendorId) : rfq.quotations;

  const myQuotation = user.role === "VENDOR" ? visibleQuotations[0] || null : null;

  return (
    <RfqDetailClient
      role={user.role}
      vendorId={user.vendorId || null}
      rfq={JSON.parse(JSON.stringify({ ...rfq, quotations: visibleQuotations }))}
      myQuotation={myQuotation ? JSON.parse(JSON.stringify(myQuotation)) : null}
    />
  );
}
