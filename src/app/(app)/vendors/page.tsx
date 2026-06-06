"use client";
import { useEffect, useState } from "react";
import Badge from "@/components/Badge";
import PageHeader from "@/components/PageHeader";

type Vendor = {
  id: string; name: string; category: string; email: string; gstNumber?: string;
  contactName?: string; phone?: string; address?: string; status: string; rating: number;
  _count?: { quotations: number; purchaseOrders: number };
};
const EMPTY = { name: "", email: "", category: "", gstNumber: "", contactName: "", phone: "", address: "", status: "ACTIVE", rating: 0 };

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const res = await fetch(`/api/vendors?${params}`);
    if (res.ok) { const d = await res.json(); setVendors(d.vendors); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, status]);

  function openCreate() { setEditing(null); setForm(EMPTY); setErr(""); setOpen(true); }
  function openEdit(v: Vendor) { setEditing(v); setForm({ ...EMPTY, ...v }); setErr(""); setOpen(true); }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setLoading(true);
    const url = editing ? `/api/vendors/${editing.id}` : "/api/vendors";
    const res = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json(); setLoading(false);
    if (!res.ok) { setErr(data.error || "Failed"); return; }
    setOpen(false); load();
  }

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <PageHeader title="Vendor Management" subtitle="Register and maintain organized vendor records."
        action={<button onClick={openCreate} className="btn-primary">+ Register Vendor</button>} />

      <div className="flex gap-3 mb-4">
        <input className="input max-w-xs" placeholder="Search name, email, GST…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option><option value="PENDING">Pending</option>
          <option value="INACTIVE">Inactive</option><option value="BLACKLISTED">Blacklisted</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b"><tr>
            <th className="th">Vendor</th><th className="th">Category</th><th className="th">GST</th>
            <th className="th">Rating</th><th className="th">Quotes / POs</th><th className="th">Status</th><th className="th"></th>
          </tr></thead>
          <tbody className="divide-y">
            {vendors.length === 0 && <tr><td className="td text-slate-400 text-center py-10" colSpan={7}>No vendors found</td></tr>}
            {vendors.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="td"><div className="font-medium text-slate-800">{v.name}</div><div className="text-xs text-slate-400">{v.email}</div></td>
                <td className="td">{v.category}</td>
                <td className="td text-xs">{v.gstNumber || "—"}</td>
                <td className="td">{v.rating ? `★ ${v.rating.toFixed(1)}` : "—"}</td>
                <td className="td text-xs">{v._count?.quotations ?? 0} / {v._count?.purchaseOrders ?? 0}</td>
                <td className="td"><Badge status={v.status} /></td>
                <td className="td text-right"><button onClick={() => openEdit(v)} className="text-brand-600 text-sm hover:underline">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setOpen(false)}>
          <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editing ? "Edit Vendor" : "Register Vendor"}</h2>
            {err && <div className="mb-3 rounded bg-rose-50 text-rose-700 text-sm px-3 py-2">{err}</div>}
            <form onSubmit={save} className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Company name *</label><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
              <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required disabled={!!editing} /></div>
              <div><label className="label">Category *</label><input className="input" value={form.category} onChange={(e) => set("category", e.target.value)} required placeholder="e.g. IT Hardware" /></div>
              <div><label className="label">GST Number</label><input className="input" value={form.gstNumber || ""} onChange={(e) => set("gstNumber", e.target.value)} /></div>
              <div><label className="label">Contact person</label><input className="input" value={form.contactName || ""} onChange={(e) => set("contactName", e.target.value)} /></div>
              <div><label className="label">Phone</label><input className="input" value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} /></div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="ACTIVE">Active</option><option value="PENDING">Pending</option>
                  <option value="INACTIVE">Inactive</option><option value="BLACKLISTED">Blacklisted</option>
                </select>
              </div>
              <div className="col-span-2"><label className="label">Address</label><textarea className="input" rows={2} value={form.address || ""} onChange={(e) => set("address", e.target.value)} /></div>
              <div><label className="label">Rating (0–5)</label><input className="input" type="number" min={0} max={5} step={0.1} value={form.rating} onChange={(e) => set("rating", e.target.value)} /></div>
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
                <button className="btn-primary" disabled={loading}>{loading ? "Saving…" : editing ? "Save changes" : "Register"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
