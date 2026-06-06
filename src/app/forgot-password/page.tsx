"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      let data: any = {};
      try { data = await res.json(); } catch {}
      setLoading(false);
      setMsg(data.message || "If an account exists, a reset email has been sent.");
    } catch {
      setLoading(false);
      setMsg("If an account exists, a reset email has been sent.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-sm card p-8">
        <div className="text-xl font-bold text-brand-700">VendorBridge</div>
        <h2 className="text-2xl font-bold text-slate-900 mt-4">Reset password</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">Enter your email and we'll send reset instructions.</p>
        {msg && <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-700 text-sm px-3 py-2">{msg}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Email</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <button className="btn-primary w-full" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</button>
        </form>
        <p className="text-sm text-slate-500 mt-6 text-center">
          <Link href="/login" className="text-brand-600 font-medium hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
