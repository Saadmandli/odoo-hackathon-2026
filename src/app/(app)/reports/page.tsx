"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { inr } from "@/lib/utils";

export default function ReportsPage() {
  const [d, setD] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/reports").then((r) => r.json()).then(setD);
    fetch("/api/scorecard").then((r) => r.json()).then((x) => setCards(x.cards || []));
  }, []);
  if (!d) return <div className="text-slate-400">Loading analytics…</div>;

  const maxMonth = Math.max(1, ...d.months.map((m: any) => m.spend));
  const maxVendor = Math.max(1, ...d.spendByVendor.map((v: any) => v.spend));
  const gradeColor: Record<string, string> = { A: "bg-emerald-100 text-emerald-700", B: "bg-blue-100 text-blue-700", C: "bg-amber-100 text-amber-700", D: "bg-rose-100 text-rose-700" };

  function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
    return <div className="card p-5"><div className="text-xs uppercase tracking-wide text-slate-400">{label}</div><div className={`text-2xl font-bold mt-1 ${accent || ""}`}>{value}</div></div>;
  }

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Procurement insights, savings, spend trends and vendor performance."
        action={<a href="/api/reports/export" className="btn-primary">⬇ Export CSV</a>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Total Spend" value={inr(d.totalSpend)} />
        <Stat label="Total Savings" value={inr(d.totalSavings)} accent="text-emerald-600" />
        <Stat label="3-Way Matched" value={`${d.stats.matchedCount}/${d.stats.invoiceCount}`} />
        <Stat label="RFQs Awarded" value={`${d.stats.awardedCount}/${d.stats.rfqCount}`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <div className="font-semibold mb-4">Monthly Spend vs Savings</div>
          <div className="flex items-end gap-3 h-48">
            {d.months.map((m: any) => (
              <div key={m.label} className="flex-1 flex flex-col items-center justify-end gap-1">
                <div className="w-full flex flex-col justify-end items-center gap-0.5" style={{ height: "160px" }}>
                  <div className="w-full rounded-t bg-brand-500" style={{ height: `${(m.spend / maxMonth) * 140}px` }} title={`Spend ${inr(m.spend)}`} />
                  <div className="w-full rounded-t bg-emerald-400" style={{ height: `${(m.savings / maxMonth) * 140}px` }} title={`Saved ${inr(m.savings)}`} />
                </div>
                <div className="text-[11px] text-slate-400">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-slate-500"><span><span className="inline-block w-3 h-3 bg-brand-500 rounded-sm mr-1"></span>Spend</span><span><span className="inline-block w-3 h-3 bg-emerald-400 rounded-sm mr-1"></span>Savings</span></div>
        </div>

        <div className="card p-5">
          <div className="font-semibold mb-4">Spend by Vendor</div>
          {d.spendByVendor.length === 0 && <div className="text-sm text-slate-400">No purchase orders yet.</div>}
          <div className="space-y-3">
            {d.spendByVendor.map((v: any) => (
              <div key={v.name}>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-700">{v.name}</span><span className="font-medium">{inr(v.spend)}</span></div>
                <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(v.spend / maxVendor) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b font-semibold">Vendor Scorecards <span className="text-xs font-normal text-slate-400">· auto-computed performance grade</span></div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b"><tr><th className="th">Vendor</th><th className="th">Grade</th><th className="th">Performance</th><th className="th">Rating</th><th className="th">Win rate</th><th className="th">Fulfillment</th><th className="th">Spend</th></tr></thead>
          <tbody className="divide-y">
            {cards.length === 0 && <tr><td className="td text-center text-slate-400 py-8" colSpan={7}>No vendor data yet.</td></tr>}
            {cards.map((c: any) => (
              <tr key={c.id}>
                <td className="td font-medium">{c.name}<div className="text-xs text-slate-400">{c.category}</div></td>
                <td className="td"><span className={`badge ${gradeColor[c.grade]}`}>{c.grade}</span></td>
                <td className="td w-40"><div className="flex items-center gap-2"><div className="h-1.5 flex-1 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${c.performance}%` }} /></div><span className="text-xs font-medium">{c.performance}</span></div></td>
                <td className="td">{c.rating ? `★ ${c.rating.toFixed(1)}` : "—"}</td>
                <td className="td">{c.winRate}%</td>
                <td className="td">{c.fulfillmentRate}%</td>
                <td className="td">{inr(c.totalSpend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
