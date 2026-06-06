"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";

type Item = { productName: string; description: string; quantity: number; unit: string };

export default function NewRfq() {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [items, setItems] = useState<Item[]>([{ productName: "", description: "", quantity: 1, unit: "pcs" }]);
  const [vendorIds, setVendorIds] = useState<string[]>([]);
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);

  useEffect(() => { fetch("/api/vendors?status=ACTIVE").then((r) => r.json()).then((d) => setVendors(d.vendors || [])); }, []);

  function setItem(i: number, k: keyof Item, v: any) { setItems((arr) => arr.map((it, idx) => idx === i ? { ...it, [k]: v } : it)); }
  function addItem() { setItems((a) => [...a, { productName: "", description: "", quantity: 1, unit: "pcs" }]); }
  function removeItem(i: number) { setItems((a) => a.filter((_, idx) => idx !== i)); }
  function toggleVendor(id: string) { setVendorIds((v) => v.includes(id) ? v.filter((x) => x !== id) : [...v, id]); }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setLoading(true);
    const res = await fetch("/api/rfqs", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, department, category, budgetAmount, deadline, items, vendorIds }) });
    const data = await res.json(); setLoading(false);
    if (!res.ok) { setErr(data.error || "Failed to create RFQ"); return; }
    router.push(`/rfqs/${data.rfq.id}`);
  }

  return (
    <div>
      <PageHeader title="Create RFQ" subtitle="Define products, budget, deadline and invite vendors." />
      {err && <div className="mb-4 rounded bg-rose-50 text-rose-700 text-sm px-3 py-2">{err}</div>}
      <form onSubmit={submit} className="space-y-6 max-w-3xl">
        <div className="card p-5 space-y-4">
          <div><label className="label">RFQ Title *</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Procurement of 50 office laptops" /></div>
          <div><label className="label">Description</label><textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div><label className="label">Department</label><input className="input" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Operations" /></div>
            <div><label className="label">Category</label><input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. IT Hardware" /></div>
            <div><label className="label">Budget (₹)</label><input className="input" type="number" min={0} value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} placeholder="Optional — enables savings tracking" /></div>
          </div>
          <div className="max-w-xs"><label className="label">Submission Deadline *</label><input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required /></div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3"><div className="font-semibold">Line Items</div><button type="button" onClick={addItem} className="btn-ghost py-1.5 text-sm">+ Add item</button></div>
          <div className="space-y-3">
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5"><label className="label text-xs">Product / Service *</label><input className="input" value={it.productName} onChange={(e) => setItem(i, "productName", e.target.value)} required /></div>
                <div className="col-span-3"><label className="label text-xs">Description</label><input className="input" value={it.description} onChange={(e) => setItem(i, "description", e.target.value)} /></div>
                <div className="col-span-2"><label className="label text-xs">Qty *</label><input className="input" type="number" min={1} value={it.quantity} onChange={(e) => setItem(i, "quantity", Number(e.target.value))} required /></div>
                <div className="col-span-1"><label className="label text-xs">Unit</label><input className="input" value={it.unit} onChange={(e) => setItem(i, "unit", e.target.value)} /></div>
                <div className="col-span-1">{items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="btn-ghost py-2 text-rose-600">✕</button>}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="font-semibold mb-3">Invite Vendors</div>
          {vendors.length === 0 && <div className="text-sm text-slate-400">No active vendors. Register vendors first.</div>}
          <div className="grid sm:grid-cols-2 gap-2">
            {vendors.map((v) => (
              <label key={v.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer ${vendorIds.includes(v.id) ? "border-brand-400 bg-brand-50" : "border-slate-200"}`}>
                <input type="checkbox" checked={vendorIds.includes(v.id)} onChange={() => toggleVendor(v.id)} />
                <div><div className="text-sm font-medium">{v.name}</div><div className="text-xs text-slate-400">{v.category}</div></div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
          <button className="btn-primary" disabled={loading}>{loading ? "Creating…" : "Create RFQ"}</button>
        </div>
      </form>
    </div>
  );
}
