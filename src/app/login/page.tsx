"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      let data: any = {};
      try { data = await res.json(); } catch { /* empty/non-JSON body */ }
      setLoading(false);
      if (!res.ok) { setErr(data.error || "Login failed. Please try again."); return; }
      router.push("/dashboard"); router.refresh();
    } catch {
      setLoading(false);
      setErr("Could not reach the server. Is the app still running?");
    }
  }

  function quick(e: string) { setEmail(e); setPassword("password123"); }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-brand-700 text-white p-12">
        <div>
          <div className="text-2xl font-bold">VendorBridge</div>
          <div className="text-brand-200 text-sm mt-1">Procurement & Vendor Management ERP</div>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight">Digitize your procurement, end to end.</h1>
          <p className="text-brand-100">Vendors, RFQs, quotations, approvals, purchase orders and invoices — one centralized platform with role-based workflows.</p>
        </div>
        <div className="text-brand-200 text-xs">© {new Date().getFullYear()} VendorBridge</div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">Welcome back. Enter your credentials.</p>
          {err && <div className="mb-4 rounded-lg bg-rose-50 text-rose-700 text-sm px-3 py-2">{err}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-brand-600 hover:underline">Forgot password?</Link>
            </div>
            <button className="btn-primary w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
          </form>
          <p className="text-sm text-slate-500 mt-6 text-center">
            No account? <Link href="/signup" className="text-brand-600 font-medium hover:underline">Sign up</Link>
          </p>
          <div className="mt-8 border-t pt-4">
            <p className="text-xs text-slate-400 mb-2">Demo accounts (password: password123)</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button type="button" onClick={() => quick("admin@vendorbridge.com")} className="btn-ghost py-1.5">Admin</button>
              <button type="button" onClick={() => quick("officer@vendorbridge.com")} className="btn-ghost py-1.5">Officer</button>
              <button type="button" onClick={() => quick("manager@vendorbridge.com")} className="btn-ghost py-1.5">Manager</button>
              <button type="button" onClick={() => quick("vendor@techno.com")} className="btn-ghost py-1.5">Vendor</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
