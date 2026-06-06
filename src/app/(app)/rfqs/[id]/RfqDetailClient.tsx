"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/Badge";
import PageHeader from "@/components/PageHeader";
import { inr, fmtDate, fmtDateTime } from "@/lib/utils";

export default function RfqDetailClient({ role, vendorId, rfq, myQuotation }: any) {
  const router = useRouter();
  const isVendor = role === "VENDOR";
  const isOfficer = role === "PROCUREMENT_OFFICER" || role === "ADMIN";

  return (
    <div>
      <PageHeader title={rfq.title}
        subtitle={`${rfq.rfqNumber} · Deadline ${fmtDate(rfq.deadline)} · By ${rfq.createdBy.name}${rfq.budgetAmount ? ` · Budget ${inr(rfq.budgetAmount)}` : ""}`}
        action={<Badge status={rfq.status} />} />

      {rfq.description && <div className="card p-5 mb-6 text-sm text-slate-600">{rfq.description}</div>}

      {rfq.attachment && (
        <a href={rfq.attachment} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-2 mb-6 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-brand-600 hover:bg-slate-50">
          📎 View RFQ attachment
        </a>
      )}

      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-3 border-b font-semibold text-slate-800">Requested Items</div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b"><tr><th className="th">Product / Service</th><th className="th">Description</th><th className="th">Qty</th><th className="th">Unit</th></tr></thead>
          <tbody className="divide-y">
            {rfq.items.map((it: any) => (
              <tr key={it.id}><td className="td font-medium">{it.productName}</td><td className="td text-slate-500">{it.description || "—"}</td><td className="td">{it.quantity}</td><td className="td">{it.unit}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {isVendor && <VendorQuote rfq={rfq} myQuotation={myQuotation} onDone={() => router.refresh()} />}
      {isOfficer && <SmartComparison rfq={rfq} onChange={() => router.refresh()} />}
      {!isVendor && <ApprovalTimeline approvals={rfq.approvals} />}
    </div>
  );
}

function VendorQuote({ rfq, myQuotation, onDone }: any) {
  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    rfq.items.forEach((it: any) => {
      const existing = myQuotation?.items?.find((qi: any) => qi.rfqItemId === it.id);
      init[it.id] = existing?.unitPrice || 0;
    });
    return init;
  });
  const [deliveryDays, setDeliveryDays] = useState(myQuotation?.deliveryDays || 7);
  const [notes, setNotes] = useState(myQuotation?.notes || "");
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);

  const total = rfq.items.reduce((s: number, it: any) => s + (prices[it.id] || 0) * it.quantity, 0);
  const closed = rfq.status !== "OPEN";

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setMsg(""); setLoading(true);
    const items = rfq.items.map((it: any) => ({ rfqItemId: it.id, unitPrice: prices[it.id] || 0 }));
    const res = await fetch("/api/quotations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rfqId: rfq.id, deliveryDays, notes, items }) });
    const data = await res.json(); setLoading(false);
    if (!res.ok) { setErr(data.error || "Failed"); return; }
    setMsg("Quotation submitted successfully."); onDone();
  }

  return (
    <div className="card p-5 mb-6">
      <div className="font-semibold mb-1">{myQuotation ? "Your Quotation" : "Submit Quotation"}</div>
      {myQuotation && <div className="mb-3"><Badge status={myQuotation.status} /></div>}
      {closed && <div className="mb-3 rounded bg-amber-50 text-amber-700 text-sm px-3 py-2">This RFQ is {rfq.status.toLowerCase()} and no longer accepts new quotations.</div>}
      {err && <div className="mb-3 rounded bg-rose-50 text-rose-700 text-sm px-3 py-2">{err}</div>}
      {msg && <div className="mb-3 rounded bg-emerald-50 text-emerald-700 text-sm px-3 py-2">{msg}</div>}
      <form onSubmit={submit}>
        <table className="w-full mb-4">
          <thead className="bg-slate-50"><tr><th className="th">Item</th><th className="th">Qty</th><th className="th">Unit Price (₹)</th><th className="th">Amount</th></tr></thead>
          <tbody className="divide-y">
            {rfq.items.map((it: any) => (
              <tr key={it.id}>
                <td className="td font-medium">{it.productName}</td>
                <td className="td">{it.quantity}</td>
                <td className="td"><input className="input max-w-[140px]" type="number" min={0} step={0.01} value={prices[it.id]} disabled={closed} onChange={(e) => setPrices((p) => ({ ...p, [it.id]: Number(e.target.value) }))} /></td>
                <td className="td font-medium">{inr((prices[it.id] || 0) * it.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div><label className="label">Delivery time (days)</label><input className="input" type="number" min={0} value={deliveryDays} disabled={closed} onChange={(e) => setDeliveryDays(Number(e.target.value))} /></div>
          <div className="flex items-end justify-end"><div className="text-right"><div className="text-xs text-slate-400">Quotation total</div><div className="text-xl font-bold">{inr(total)}</div></div></div>
        </div>
        <div className="mb-4"><label className="label">Notes / comments</label><textarea className="input" rows={2} value={notes} disabled={closed} onChange={(e) => setNotes(e.target.value)} /></div>
        {!closed && <button className="btn-primary" disabled={loading}>{loading ? "Submitting…" : myQuotation ? "Update Quotation" : "Submit Quotation"}</button>}
      </form>
    </div>
  );
}

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  return <div className="h-1.5 w-full rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} /></div>;
}

function SmartComparison({ rfq, onChange }: any) {
  const [busy, setBusy] = useState("");
  const [rec, setRec] = useState<any>(null);
  const quotes = rfq.quotations;

  useEffect(() => {
    if (quotes.length) fetch(`/api/rfqs/${rfq.id}/recommendation`).then((r) => r.json()).then(setRec).catch(() => {});
  }, [rfq.id, quotes.length]);

  if (quotes.length === 0) return <div className="card p-8 text-center text-slate-400 mb-6">No quotations received yet.</div>;

  const approvedQuoteId = rfq.approvals.find((a: any) => a.status === "APPROVED")?.quotationId;
  const scoredById: Record<string, any> = {};
  (rec?.scored || []).forEach((s: any) => (scoredById[s.quotationId] = s));
  const winner = rec?.winner;
  const highest = Math.max(...quotes.map((q: any) => q.totalAmount));

  async function requestApproval(quotationId: string) {
    setBusy(quotationId);
    const res = await fetch("/api/approvals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quotationId }) });
    const d = await res.json(); setBusy("");
    if (res.ok) { if (d.autoApproved) alert(`Auto-approved within delegated limit (${d.tier}). You can now generate the PO.`); onChange(); }
    else alert(d.error);
  }
  async function generatePO(quotationId: string) {
    setBusy(quotationId);
    const res = await fetch("/api/purchase-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quotationId }) });
    setBusy(""); if (res.ok) onChange(); else alert(await res.json().then(d=>d.error).catch(()=>'Action failed'));
  }
  async function generateInvoice(purchaseOrderId: string) {
    setBusy(purchaseOrderId);
    const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purchaseOrderId }) });
    setBusy(""); if (res.ok) onChange(); else alert(await res.json().then(d=>d.error).catch(()=>'Action failed'));
  }

  return (
    <div className="mb-6">
      {/* Smart Award recommendation banner */}
      {winner && (
        <div className="card mb-4 p-5 border-l-4 border-l-brand-500 bg-gradient-to-r from-brand-50 to-white">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <span className="badge bg-brand-600 text-white">★ Smart Award</span>
                <span className="font-semibold text-slate-900">Recommended: {winner.vendorName}</span>
                <span className="text-xs text-slate-500">score {winner.score}/100</span>
              </div>
              <ul className="mt-2 text-sm text-slate-600 list-disc list-inside space-y-0.5">
                {(rec.reasons || []).map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Projected savings vs highest bid</div>
              <div className="text-2xl font-bold text-emerald-600">{inr(highest - winner.totalAmount)}</div>
              {rfq.budgetAmount && <div className="text-xs text-slate-400 mt-1">vs budget: <span className="text-emerald-600 font-medium">{inr(Math.max(0, rfq.budgetAmount - winner.totalAmount))}</span></div>}
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <div className="px-5 py-3 border-b font-semibold text-slate-800">Quotation Comparison <span className="text-xs font-normal text-slate-400">· ranked by Smart Award score</span></div>
        <table className="w-full min-w-[760px]">
          <thead className="bg-slate-50 border-b"><tr>
            <th className="th">Rank</th><th className="th">Vendor</th><th className="th">Smart Score</th><th className="th">Delivery</th><th className="th">Total</th><th className="th">Status</th><th className="th">Action</th>
          </tr></thead>
          <tbody className="divide-y">
            {[...quotes].sort((a: any, b: any) => (scoredById[b.id]?.score || 0) - (scoredById[a.id]?.score || 0)).map((q: any) => {
              const po = q.purchaseOrder;
              const sc = scoredById[q.id];
              const isWinner = winner?.quotationId === q.id;
              return (
                <tr key={q.id} className={isWinner ? "bg-brand-50/50" : ""}>
                  <td className="td">{sc ? <span className={`badge ${sc.rank === 1 ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"}`}>#{sc.rank}</span> : "—"}</td>
                  <td className="td"><div className="font-medium">{q.vendor.name} {isWinner && <span className="text-brand-600">★</span>}</div><div className="text-xs text-slate-400">{q.vendor.rating ? `★ ${q.vendor.rating.toFixed(1)}` : ""} {q.notes || ""}</div></td>
                  <td className="td w-40">
                    {sc ? (<div><div className="flex justify-between text-xs mb-1"><span className="font-semibold">{sc.score}</span><span className="text-slate-400">/100</span></div><ScoreBar value={sc.score} max={100} color={isWinner ? "bg-brand-500" : "bg-slate-400"} /></div>) : "—"}
                  </td>
                  <td className="td">{q.deliveryDays}d {sc?.isFastest && <span className="badge bg-blue-100 text-blue-700 ml-1">fastest</span>}</td>
                  <td className="td font-semibold">{inr(q.totalAmount)} {sc?.isLowestPrice && <span className="badge bg-emerald-100 text-emerald-700 ml-1">lowest</span>}</td>
                  <td className="td"><Badge status={q.status} /></td>
                  <td className="td">
                    {!approvedQuoteId && q.status === "SUBMITTED" && <button onClick={() => requestApproval(q.id)} disabled={busy === q.id} className="btn-primary py-1.5 text-xs">{busy === q.id ? "…" : "Select & approve"}</button>}
                    {q.status === "SELECTED" && !approvedQuoteId && <span className="text-xs text-amber-600">Awaiting approval</span>}
                    {approvedQuoteId === q.id && !po && <button onClick={() => generatePO(q.id)} disabled={busy === q.id} className="btn-success py-1.5 text-xs">{busy === q.id ? "…" : "Generate PO"}</button>}
                    {po && !po.invoice && <button onClick={() => generateInvoice(po.id)} disabled={busy === po.id} className="btn-success py-1.5 text-xs">{busy === po.id ? "…" : "Generate Invoice"}</button>}
                    {po?.invoice && <a href="/invoices" className="text-brand-600 text-xs hover:underline">View invoice →</a>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rec && <div className="px-5 py-2 border-t text-[11px] text-slate-400">Smart Award weights — Price 45% · Delivery 25% · Vendor rating 20% · Reliability 10%</div>}
      </div>
    </div>
  );
}

function ApprovalTimeline({ approvals }: any) {
  if (!approvals?.length) return null;
  return (
    <div className="card p-5 mt-6">
      <div className="font-semibold mb-3">Approval Timeline</div>
      <div className="space-y-3">
        {approvals.map((a: any) => (
          <div key={a.id} className="flex items-start gap-3">
            <div className={`mt-1 h-2.5 w-2.5 rounded-full ${a.status === "APPROVED" ? "bg-emerald-500" : a.status === "REJECTED" ? "bg-rose-500" : "bg-amber-400"}`} />
            <div className="text-sm">
              <div className="text-slate-700"><Badge status={a.status} /> — {a.quotation.vendor.name} {a.autoApproved && <span className="badge bg-indigo-100 text-indigo-700 ml-1">auto</span>} {a.tier && <span className="text-xs text-slate-400 ml-1">{a.tier}</span>}</div>
              {a.remarks && <div className="text-slate-500 mt-0.5">"{a.remarks}"</div>}
              <div className="text-xs text-slate-400 mt-0.5">{a.approver?.name ? `${a.approver.name} · ` : ""}{fmtDateTime(a.decidedAt || a.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
