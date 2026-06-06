"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import { fmtDate } from "@/lib/utils";

export default function GRNPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  useEffect(() => { fetch("/api/goods-receipts").then((r) => r.json()).then((d) => setReceipts(d.receipts || [])); }, []);
  return (
    <div>
      <PageHeader title="Goods Receipts" subtitle="Confirm delivery against purchase orders to enable 3-way matching." />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-slate-50 border-b"><tr>
            <th className="th">GRN #</th><th className="th">PO #</th><th className="th">Vendor</th><th className="th">Items received</th><th className="th">Status</th><th className="th">Received by</th><th className="th">Date</th>
          </tr></thead>
          <tbody className="divide-y">
            {receipts.length === 0 && <tr><td className="td text-center text-slate-400 py-10" colSpan={7}>No goods receipts yet. Record one from the Purchase Orders page.</td></tr>}
            {receipts.map((g) => (
              <tr key={g.id} className="hover:bg-slate-50">
                <td className="td font-medium">{g.grnNumber}</td>
                <td className="td">{g.purchaseOrder.poNumber}</td>
                <td className="td">{g.purchaseOrder.vendor.name}</td>
                <td className="td text-sm">{g.items.map((i: any) => `${i.rfqItem.productName} (${i.receivedQty}/${i.orderedQty})`).join(", ")}</td>
                <td className="td"><Badge status={g.status === "COMPLETE" ? "FULFILLED" : "ACKNOWLEDGED"} /></td>
                <td className="td text-sm">{g.receivedBy?.name || "—"}</td>
                <td className="td text-sm">{fmtDate(g.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
