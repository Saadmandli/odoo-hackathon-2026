"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/Badge";
import PageHeader from "@/components/PageHeader";
import { inr, fmtDate } from "@/lib/utils";

const MATCH: Record<string, string> = { MATCHED: "bg-emerald-100 text-emerald-700", MISMATCH: "bg-rose-100 text-rose-700", PENDING: "bg-amber-100 text-amber-700" };

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [busy, setBusy] = useState(""); const [toast, setToast] = useState("");

  async function load() {
    const [i, m] = await Promise.all([fetch("/api/invoices").then((r) => r.json()), fetch("/api/me").then((r) => r.json())]);
    setInvoices(i.invoices || []); setMe(m.user);
  }
  useEffect(() => { load(); }, []);
  const canSend = me && (me.role === "PROCUREMENT_OFFICER" || me.role === "ADMIN");

  function download(id: string) { window.open(`/api/invoices/${id}/pdf`, "_blank"); }
  function print(id: string) { window.open(`/api/invoices/${id}/pdf?inline=1`, "_blank"); }
  async function send(id: string) {
    setBusy(id);
    const res = await fetch(`/api/invoices/${id}/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const d = await res.json(); setBusy("");
    if (res.ok) { setToast(d.mode === "console" ? `Invoice logged to server console (no SMTP) → ${d.to}` : `Invoice emailed to ${d.to}`); load(); setTimeout(() => setToast(""), 5000); } else alert(d.error);
  }

  return (
    <div>
      <PageHeader title="Invoices" subtitle="Generate, print, download, email — with automatic 3-way match (PO · Goods · Invoice)." />
      {toast && <div className="mb-4 rounded bg-emerald-50 text-emerald-700 text-sm px-3 py-2">{toast}</div>}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead className="bg-slate-50 border-b"><tr>
            <th className="th">Invoice #</th><th className="th">PO #</th><th className="th">Vendor</th><th className="th">Total</th><th className="th">3-Way Match</th><th className="th">Status</th><th className="th">Actions</th>
          </tr></thead>
          <tbody className="divide-y">
            {invoices.length === 0 && <tr><td className="td text-center text-slate-400 py-10" colSpan={7}>No invoices yet.</td></tr>}
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="td font-medium">{inv.invoiceNumber}</td>
                <td className="td text-sm">{inv.purchaseOrder.poNumber}</td>
                <td className="td">{inv.purchaseOrder.vendor.name}</td>
                <td className="td font-semibold">{inr(inv.totalAmount)}</td>
                <td className="td"><span className={`badge ${MATCH[inv.matchStatus] || "bg-slate-100 text-slate-600"}`}>{inv.matchStatus === "PENDING" ? "Awaiting goods" : inv.matchStatus === "MATCHED" ? "✓ Matched" : "Mismatch"}</span></td>
                <td className="td"><Badge status={inv.status} /></td>
                <td className="td">
                  <div className="flex gap-1.5">
                    <button onClick={() => download(inv.id)} className="btn-ghost py-1 px-2 text-xs">Download</button>
                    <button onClick={() => print(inv.id)} className="btn-ghost py-1 px-2 text-xs">Print</button>
                    {canSend && <button onClick={() => send(inv.id)} disabled={busy === inv.id} className="btn-primary py-1 px-2 text-xs">{busy === inv.id ? "Sending…" : "Email"}</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
