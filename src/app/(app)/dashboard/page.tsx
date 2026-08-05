import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { inr, fmtDate } from "@/lib/utils";
import Badge from "@/components/Badge";
import PageHeader from "@/components/PageHeader";

async function getData(role: string, vendorId?: string | null) {
  const vendorScope = role === "SELLER" && vendorId;
  const [activeRfqs, pendingApprovals, vendorCount, spend, savings, recentPOs, recentInvoices] = await Promise.all([
    prisma.rFQ.count({ where: vendorScope ? { status: "OPEN", invitedVendors: { some: { vendorId } } } : { status: "OPEN" } }),
    prisma.approval.count({ where: { status: "PENDING" } }),
    prisma.vendor.count(),
    prisma.purchaseOrder.aggregate({ _sum: { totalAmount: true }, where: vendorScope ? { vendorId } : {} }),
    prisma.purchaseOrder.aggregate({ _sum: { savings: true }, where: vendorScope ? { vendorId } : {} }),
    prisma.purchaseOrder.findMany({ where: vendorScope ? { vendorId } : {}, take: 5, orderBy: { createdAt: "desc" }, include: { vendor: true } }),
    prisma.invoice.findMany({ where: vendorScope ? { purchaseOrder: { vendorId } } : {}, take: 5, orderBy: { createdAt: "desc" }, include: { purchaseOrder: { include: { vendor: true } } } }),
  ]);
  return { activeRfqs, pendingApprovals, vendorCount, spend: spend._sum.totalAmount || 0, savings: savings._sum.savings || 0, recentPOs, recentInvoices };
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`text-2xl font-bold mt-2 ${accent || "text-slate-900"}`}>{value}</div>
    </div>
  );
}

export default async function Dashboard() {
  const user = (await getSession())!;
  const d = await getData(user.role, user.vendorId);
  const isVendor = user.role === "SELLER";

  return (
    <div>
      <PageHeader title={`Welcome, ${user.name.split(" ")[0]}`} subtitle="Here's a snapshot of your procurement activity." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label={isVendor ? "Open RFQs (invited)" : "Active RFQs"} value={String(d.activeRfqs)} accent="text-brand-600" />
        {!isVendor && <Stat label="Pending Approvals" value={String(d.pendingApprovals)} accent="text-amber-600" />}
        <Stat label={isVendor ? "Your PO Value" : "Total Spend"} value={inr(d.spend)} />
        {!isVendor && <Stat label="Total Savings" value={inr(d.savings)} accent="text-emerald-600" />}
        {isVendor && <Stat label="Registered Vendors" value={String(d.vendorCount)} />}
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        {(user.role === "BUYER" || user.role === "ADMIN") && (
          <>
            <Link href="/rfqs/new" className="btn-primary">+ New RFQ</Link>
            <Link href="/vendors" className="btn-ghost">Manage Vendors</Link>
            <Link href="/reports" className="btn-ghost">View Reports</Link>
          </>
        )}
        {isVendor && <Link href="/rfqs" className="btn-primary">View Open RFQs</Link>}
        <Link href="/invoices" className="btn-ghost">Invoices</Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="px-5 py-4 border-b font-semibold text-slate-800">Recent Purchase Orders</div>
          <div className="divide-y">
            {d.recentPOs.length === 0 && <div className="px-5 py-8 text-sm text-slate-400 text-center">No purchase orders yet</div>}
            {d.recentPOs.map((po) => (
              <Link key={po.id} href="/purchase-orders" className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                <div><div className="text-sm font-medium text-slate-800">{po.poNumber}</div><div className="text-xs text-slate-400">{po.vendor.name} · {fmtDate(po.createdAt)}</div></div>
                <div className="text-right"><div className="text-sm font-semibold">{inr(po.totalAmount)}</div><Badge status={po.status} /></div>
              </Link>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="px-5 py-4 border-b font-semibold text-slate-800">Recent Invoices</div>
          <div className="divide-y">
            {d.recentInvoices.length === 0 && <div className="px-5 py-8 text-sm text-slate-400 text-center">No invoices yet</div>}
            {d.recentInvoices.map((inv) => (
              <Link key={inv.id} href="/invoices" className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                <div><div className="text-sm font-medium text-slate-800">{inv.invoiceNumber}</div><div className="text-xs text-slate-400">{inv.purchaseOrder.vendor.name} · {fmtDate(inv.createdAt)}</div></div>
                <div className="text-right"><div className="text-sm font-semibold">{inr(inv.totalAmount)}</div><Badge status={inv.status} /></div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
