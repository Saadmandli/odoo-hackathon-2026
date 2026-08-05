import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await requireUser();
    const vendorScope = user.role === "SELLER" && user.vendorId;

    const [activeRfqs, pendingApprovals, recentPOs, recentInvoices, vendorCount, totalSpendAgg] = await Promise.all([
      prisma.rFQ.count({ where: vendorScope ? { status: "OPEN", invitedVendors: { some: { vendorId: user.vendorId! } } } : { status: "OPEN" } }),
      prisma.approval.count({ where: { status: "PENDING" } }),
      prisma.purchaseOrder.findMany({ where: vendorScope ? { vendorId: user.vendorId! } : {}, take: 5, orderBy: { createdAt: "desc" }, include: { vendor: true } }),
      prisma.invoice.findMany({ where: vendorScope ? { purchaseOrder: { vendorId: user.vendorId! } } : {}, take: 5, orderBy: { createdAt: "desc" }, include: { purchaseOrder: { include: { vendor: true } } } }),
      prisma.vendor.count(),
      prisma.purchaseOrder.aggregate({ _sum: { totalAmount: true }, where: vendorScope ? { vendorId: user.vendorId! } : {} }),
    ]);

    return NextResponse.json({
      stats: {
        activeRfqs, pendingApprovals, vendorCount,
        totalSpend: totalSpendAgg._sum.totalAmount || 0,
        poCount: recentPOs.length, invoiceCount: recentInvoices.length,
      },
      recentPOs, recentInvoices,
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
