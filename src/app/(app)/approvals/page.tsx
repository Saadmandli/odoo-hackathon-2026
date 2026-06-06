"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/Badge";
import PageHeader from "@/components/PageHeader";
import { inr, fmtDateTime } from "@/lib/utils";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [busy, setBusy] = useState("");
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  async function load() {
    const [a, m] = await Promise.all([fetch("/api/approvals").then((r) => r.json()), fetch("/api/me").then((r) => r.json())]);
    setApprovals(a.approvals || []); setMe(m.user);
  }
  useEffect(() => { load(); }, []);

  const canDecide = me && (me.role === "MANAGER" || me.role === "ADMIN");

  async function decide(approvalId: string, decision: "APPROVED" | "REJECTED") {
    setBusy(approvalId);
    const res = await fetch("/api/approvals", { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalId, decision, remarks: remarks[approvalId] || "" }) });
    setBusy(""); if (res.ok) load(); else alert((await res.json()).error);
  }

  const pending = approvals.filter((a) => a.status === "PENDING");
  const decided = approvals.filter((a) => a.status !== "PENDING");

  return (
    <div>
      <PageHeader title="Approval Workflow" subtitle="Review and decide on procurement requests." />

      <div className="card mb-6">
        <div className="px-5 py-3 border-b font-semibold">Pending Approvals ({pending.length})</div>
        <div className="divide-y">
          {pending.length === 0 && <div className="px-5 py-8 text-center text-slate-400 text-sm">Nothing awaiting approval.</div>}
          {pending.map((a) => (
            <div key={a.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={`/rfqs/${a.rfqId}`} className="font-medium text-brand-600">{a.rfq.rfqNumber}</Link>
                  <div className="text-sm text-slate-700">{a.rfq.title}</div>
                  <div className="text-xs text-slate-500 mt-1">Vendor: <b>{a.quotation.vendor.name}</b> · Quote: <b>{inr(a.quotation.totalAmount)}</b> · {fmtDateTime(a.createdAt)}</div>
                </div>
                <Badge status={a.status} />
              </div>
              {canDecide && (
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <input className="input flex-1" placeholder="Approval remarks (optional)" value={remarks[a.id] || ""} onChange={(e) => setRemarks((r) => ({ ...r, [a.id]: e.target.value }))} />
                  <button onClick={() => decide(a.id, "APPROVED")} disabled={busy === a.id} className="btn-success">Approve</button>
                  <button onClick={() => decide(a.id, "REJECTED")} disabled={busy === a.id} className="btn-danger">Reject</button>
                </div>
              )}
              {!canDecide && <div className="text-xs text-slate-400 mt-2">Awaiting a Manager's decision.</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="px-5 py-3 border-b font-semibold">Decision History</div>
        <div className="divide-y">
          {decided.length === 0 && <div className="px-5 py-8 text-center text-slate-400 text-sm">No decisions yet.</div>}
          {decided.map((a) => (
            <div key={a.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <Link href={`/rfqs/${a.rfqId}`} className="text-sm font-medium text-brand-600">{a.rfq.rfqNumber}</Link>
                <span className="text-sm text-slate-600"> — {a.quotation.vendor.name} · {inr(a.quotation.totalAmount)}</span>
                {a.remarks && <div className="text-xs text-slate-500">"{a.remarks}"</div>}
                <div className="text-xs text-slate-400">{a.approver?.name} · {fmtDateTime(a.decidedAt || a.createdAt)}</div>
              </div>
              <Badge status={a.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
