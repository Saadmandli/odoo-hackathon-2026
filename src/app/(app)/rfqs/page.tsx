"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/Badge";
import PageHeader from "@/components/PageHeader";
import { fmtDate } from "@/lib/utils";

export default function RfqsPage() {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [role, setRole] = useState("");

  useEffect(() => {
    fetch("/api/rfqs").then((r) => r.json()).then((d) => setRfqs(d.rfqs || []));
    fetch("/api/me").then((r) => r.json()).then((d) => setRole(d.user?.role || ""));
  }, []);

  return (
    <div>
      <PageHeader
        title="Requests for Quotation"
        subtitle="Initiate and track procurement workflows."
        action={
          role === "BUYER" ? (
            <Link href="/rfqs/new" className="btn-primary">+ New RFQ</Link>
          ) : role === "ADMIN" ? (
            <span className="badge bg-indigo-50 text-indigo-700 font-semibold px-3 py-1 border border-indigo-200">
              🛡️ Admin System Oversight Mode
            </span>
          ) : null
        }
      />
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b"><tr>
            <th className="th">RFQ #</th><th className="th">Title</th><th className="th">Category / Subcategory</th><th className="th">Items</th>
            <th className="th">Invited</th><th className="th">Quotes</th><th className="th">Deadline</th><th className="th">Status</th>
          </tr></thead>
          <tbody className="divide-y">
            {rfqs.length === 0 && <tr><td className="td text-center text-slate-400 py-10" colSpan={8}>No matching RFQs for your category</td></tr>}
            {rfqs.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 cursor-pointer">
                <td className="td"><Link href={`/rfqs/${r.id}`} className="text-brand-600 font-medium">{r.rfqNumber}</Link></td>
                <td className="td"><Link href={`/rfqs/${r.id}`} className="text-slate-800">{r.title}</Link></td>
                <td className="td">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded w-fit">{r.category || "General"}</span>
                    {r.subcategory && <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-fit">{r.subcategory}</span>}
                  </div>
                </td>
                <td className="td">{r.items?.length ?? 0}</td>
                <td className="td">{r.invitedVendors?.length ?? 0}</td>
                <td className="td">{r._count?.quotations ?? 0}</td>
                <td className="td text-sm">{fmtDate(r.deadline)}</td>
                <td className="td"><Badge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
