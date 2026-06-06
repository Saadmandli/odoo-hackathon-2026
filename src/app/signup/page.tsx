"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "PROCUREMENT_OFFICER", vendorName: "", category: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      let data: any = {};
      try { data = await res.json(); } catch {}
      setLoading(false);
      if (!res.ok) { setErr(data.error || "Signup failed"); return; }
      router.push("/dashboard"); router.refresh();
    } catch {
      setLoading(false);
      setErr("Could not reach the server. Is the app still running?");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md card p-8">
        <div className="text-xl font-bold text-brand-700">VendorBridge</div>
        <h2 className="text-2xl font-bold text-slate-900 mt-4">Create your account</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">Get started with VendorBridge.</p>
        {err && <div className="mb-4 rounded-lg bg-rose-50 text-rose-700 text-sm px-3 py-2">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Full name</label><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
          <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required /></div>
          <div><label className="label">Password</label><input className="input" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required minLength={6} /></div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => set("role", e.target.value)}>
              <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
              <option value="MANAGER">Manager / Approver</option>
              <option value="VENDOR">Vendor</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {form.role === "VENDOR" && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Company</label><input className="input" value={form.vendorName} onChange={(e) => set("vendorName", e.target.value)} placeholder="Vendor company" /></div>
              <div><label className="label">Category</label><input className="input" value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. IT Hardware" /></div>
            </div>
          )}
          <button className="btn-primary w-full" disabled={loading}>{loading ? "Creating…" : "Create account"}</button>
        </form>
        <p className="text-sm text-slate-500 mt-6 text-center">
          Already have an account? <Link href="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
