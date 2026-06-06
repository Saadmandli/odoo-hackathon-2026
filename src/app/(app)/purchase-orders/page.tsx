"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/Badge";
import PageHeader from "@/components/PageHeader";
import { inr, fmtDate } from "@/lib/utils";

export default function POPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [busy, setBusy] = useState("");
  const [grnFor, setGrnFor] = useState<any>(null);

  async function load() {
    const [o, m] = await Promise.all([fetch("/api/purchase-orders").then((r) => r.json()), fetch("/api/me").then((r) => r.json())]);
    setOrders(o.orders || []); setMe(m.user);
  }
  useEffect(() => { load(); }, []);

  async function genInvoice(poId: string) {
    setBusy(poId);
    const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purchaseOrderId: poId }) });
    setBusy(""); if (res.ok) load(); else alert((await res.json()).error);
  }
  const canManage = me && (me.role === "PROCUREMENT_OFFICER" || me.role === "ADMIN" || me.role === "MANAGER");
  const canInvoice = me && (me.role === "PROCUREMENT_OFFICER" || me.role === "ADMIN");

  const totalSavings = orders.reduce((s, p) => s + (p.savings || 0), 0);

  return (
    <div>
      <PageHeader title="Purchase Orders" subtitle="Official procurement documents generated from approved quotations."
        action={totalSavings > 0 ? <div className="text-right"><div className="text-xs text-slate-400">Total negotiated savings</div><div className="text-xl font-bold text-emerald-600">{inr(totalSavings)}</div></div> : undefined} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead className="bg-slate-50 border-b"><tr>
            <th className="th">PO #</th><th className="th">Vendor</th><th className="th">Total</th><th className="th">Savings</th><th className="th">Status</th><th className="th">Goods</th><th className="th">Invoice</th><th className="th">Actions</th>
          </tr></thead>
          <tbody className="divide-y">
            {orders.length === 0 && <tr><td className="td text-center text-slate-400 py-10" colSpan={8}>No purchase orders yet.</td></tr>}
            {orders.map((po) => (
              <tr key={po.id} className="hover:bg-slate-50">
                <td className="td font-medium">{po.poNumber}</td>
                <td className="td">{po.vendor.name}</td>
                <td className="td font-semibold">{inr(po.totalAmount)}</td>
                <td className="td">{po.savings > 0 ? <span className="text-emerald-600 font-medium">{inr(po.savings)}</span> : "—"}</td>
                <td className="td"><Badge status={po.status} /></td>
                <td className="td">{po.goodsReceipt ? <Badge status={po.goodsReceipt.status === "COMPLETE" ? "FULFILLED" : "ACKNOWLEDGED"} /> : canManage ? <button onClick={() => setGrnFor(po)} className="btn-ghost py-1 px-2 text-xs">Receive</button> : <span className="text-slate-400 text-xs">Pending</span>}</td>
                <td className="td">
                  {po.invoice ? <Link href="/invoices" className="text-brand-600 text-sm hover:underline">{po.invoice.invoiceNumber}</Link>
                    : canInvoice ? <button onClick={() => genInvoice(po.id)} disabled={busy === po.id} className="btn-success py-1 text-xs">{busy === po.id ? "…" : "Generate"}</button>
                    : <span className="text-slate-400 text-sm">—</span>}
                </td>
                <td className="td"><a href={`/api/purchase-orders/${po.id}/pdf`} target="_blank" className="btn-ghost py-1 px-2 text-xs">PDF</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {grnFor && <ReceiveModal po={grnFor} onClose={() => setGrnFor(null)} onDone={() => { setGrnFor(null); load(); }} />}
    </div>
  );
}

function ReceiveModal({ po, onClose, onDone }: any) {
  const [detail, setDetail] = useState<any>(null);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // pull the RFQ items + ordered quantities via the PO's quotation
    fetch(`/api/purchase-orders`).then((r) => r.json()).then((d) => {
      const full = (d.orders || []).find((o: any) => o.id === po.id);
      // need item-level data; fetch the rfq detail
      fetch(`/api/rfqs/${full.quotation.rfqId}`).then((r) => r.json()).then((rd) => {
        const q = rd.rfq.quotations.find((x: any) => x.id === full.quotationId) || rd.rfq.quotations[0];
        const items = (q?.items || []).map((it: any) => ({ rfqItemId: it.rfqItemId, name: it.rfqItem.productName, orderedQty: it.quantity }));
        setDetail(items);
        const init: Record<string, number> = {}; items.forEach((i: any) => (init[i.rfqItemId] = i.orderedQty)); setQtys(init);
      });
    });
  }, [po.id]);

  async function submit() {
    setLoading(true);
    const lines = Object.entries(qtys).map(([rfqItemId, receivedQty]) => ({ rfqItemId, receivedQty }));
    const res = await fetch("/api/goods-receipts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purchaseOrderId: po.id, notes, lines }) });
    const d = await res.json(); setLoading(false);
    if (res.ok) { alert(`Goods recorded. 3-way match: ${d.match}`); onDone(); } else alert(d.error);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-1">Receive Goods — {po.poNumber}</h2>
        <p className="text-sm text-slate-500 mb-4">Confirm received quantities. The invoice clears only when PO = Goods = Invoice (3-way match).</p>
        {!detail && <div className="text-slate-400 text-sm">Loading items…</div>}
        {detail && (
          <div className="space-y-2 mb-4">
            {detail.map((it: any) => (
              <div key={it.rfqItemId} className="flex items-center justify-between gap-3">
                <div className="text-sm"><div className="font-medium">{it.name}</div><div className="text-xs text-slate-400">Ordered: {it.orderedQty}</div></div>
                <input className="input max-w-[120px]" type="number" min={0} max={it.orderedQty} value={qtys[it.rfqItemId] ?? it.orderedQty} onChange={(e) => setQtys((q) => ({ ...q, [it.rfqItemId]: Number(e.target.value) }))} />
              </div>
            ))}
            <div><label className="label">Notes</label><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional remarks" /></div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={submit} disabled={loading || !detail} className="btn-primary">{loading ? "Recording…" : "Confirm Receipt"}</button>
        </div>
      </div>
    </div>
  );
}
