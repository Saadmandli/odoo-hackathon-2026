"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateEmail } from "@/lib/validation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const emailValid = !email || validateEmail(email);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    if (!validateEmail(email)) {
      setErr("Please enter a valid email address (e.g. name@company.com)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      let data: any = {};
      try { data = await res.json(); } catch {}
      setLoading(false);
      if (!res.ok) {
        setErr(data.error || "Login failed. Please try again.");
        return;
      }
      if (data.status === "PENDING" || data.status === "REJECTED") {
        router.push("/pending-approval");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setLoading(false);
      setErr("Could not reach the server. Is the app running?");
    }
  }

  function quick(e: string) {
    setEmail(e);
    setPassword("password123");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-brand-700 text-white p-12">
        <div>
          <div className="text-2xl font-bold">VendorBridge</div>
          <div className="text-brand-200 text-sm mt-1">Procurement & Vendor Management ERP</div>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight">Digitize your procurement, end to end.</h1>
          <p className="text-brand-100">
            Buyers, Sellers, RFQs, quotations, approvals, purchase orders and invoices — one centralized platform with role-based workflows.
          </p>
        </div>
        <div className="text-brand-200 text-xs">© {new Date().getFullYear()} VendorBridge</div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">Welcome back. Enter your credentials.</p>
          {err && <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 font-medium">{err}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                className={`input ${email && !emailValid ? "border-rose-500 focus:ring-rose-500/20" : ""}`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
              />
              {email && !emailValid && (
                <div className="text-[11px] text-rose-600 mt-1">Invalid email format (e.g. name@company.com)</div>
              )}
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-brand-600 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
            <button className="btn-primary w-full shadow-md" disabled={loading || !emailValid}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="text-sm text-slate-500 mt-6 text-center">
            No account?{" "}
            <Link href="/signup" className="text-brand-600 font-semibold hover:underline">
              Sign up
            </Link>
          </p>
          <div className="mt-8 border-t pt-4">
            <p className="text-xs text-slate-400 mb-2">Demo accounts (password: password123)</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button type="button" onClick={() => quick("admin@vendorbridge.com")} className="btn-ghost py-1.5 font-semibold text-slate-800">
                Main Admin
              </button>
              <button type="button" onClick={() => quick("buyer@vendorbridge.com")} className="btn-ghost py-1.5 font-semibold text-indigo-700">
                Buyer
              </button>
              <button type="button" onClick={() => quick("vendor@techno.com")} className="btn-ghost py-1.5 font-semibold text-emerald-700">
                Seller
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
