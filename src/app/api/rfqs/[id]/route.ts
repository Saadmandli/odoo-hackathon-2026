import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const rfq = await prisma.rFQ.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { name: true, email: true } },
        items: true,
        invitedVendors: { include: { vendor: true } },
        quotations: { include: { vendor: true, items: { include: { rfqItem: true } } }, orderBy: { totalAmount: "asc" } },
        approvals: { include: { approver: { select: { name: true } }, quotation: { include: { vendor: true } } }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!rfq) return NextResponse.json({ error: "RFQ not found" }, { status: 404 });

    // Vendors may only access RFQs they were invited to...
    if (user.role === "VENDOR") {
      if (!rfq.invitedVendors.some((iv) => iv.vendorId === user.vendorId))
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      // ...and only see their own quotation, not competitors'.
      rfq.quotations = rfq.quotations.filter((q) => q.vendorId === user.vendorId);
    }
    return NextResponse.json({ rfq });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
