import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";

export async function GET() {
  try {
    await requireUser(["ADMIN", "BUYER"]);

    const pos = await prisma.purchaseOrder.findMany({ include: { vendor: true } });
    const totalSpend = pos.reduce((s, p) => s + p.totalAmount, 0);
    const totalSavings = pos.reduce((s, p) => s + p.savings, 0);
    const totalBudgetSaving = pos.reduce((s, p) => s + p.budgetSaving, 0);

    const byVendorMap = new Map<string, { name: string; spend: number; orders: number }>();
    for (const p of pos) {
      const cur = byVendorMap.get(p.vendorId) || { name: p.vendor.name, spend: 0, orders: 0 };
      cur.spend += p.totalAmount; cur.orders += 1;
      byVendorMap.set(p.vendorId, cur);
    }
    const spendByVendor = [...byVendorMap.values()].sort((a, b) => b.spend - a.spend);

    const months: { label: string; spend: number; savings: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const inMonth = pos.filter((p) => p.createdAt >= d && p.createdAt < next);
      months.push({
        label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        spend: inMonth.reduce((s, p) => s + p.totalAmount, 0),
        savings: inMonth.reduce((s, p) => s + p.savings, 0),
      });
    }

    const vendors = await prisma.vendor.findMany({ include: { _count: { select: { purchaseOrders: true, quotations: true } } }, orderBy: { rating: "desc" } });

    const [rfqCount, quotationCount, poCount, invoiceCount, awardedCount, matchedCount] = await Promise.all([
      prisma.rFQ.count(), prisma.quotation.count(), prisma.purchaseOrder.count(),
      prisma.invoice.count(), prisma.rFQ.count({ where: { status: "AWARDED" } }),
      prisma.invoice.count({ where: { matchStatus: "MATCHED" } }),
    ]);

    return NextResponse.json({
      totalSpend, totalSavings, totalBudgetSaving, spendByVendor, months,
      vendors: vendors.map((v) => ({ name: v.name, category: v.category, rating: v.rating, orders: v._count.purchaseOrders, quotes: v._count.quotations })),
      stats: { rfqCount, quotationCount, poCount, invoiceCount, awardedCount, matchedCount },
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
