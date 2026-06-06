"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Role } from "@prisma/client";

type Item = { href: string; label: string; roles?: Role[] };
const NAV: Item[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/vendors", label: "Vendors", roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"] },
  { href: "/rfqs", label: "RFQs" },
  { href: "/approvals", label: "Approvals", roles: ["ADMIN", "MANAGER", "PROCUREMENT_OFFICER"] },
  { href: "/purchase-orders", label: "Purchase Orders" },
  { href: "/goods-receipts", label: "Goods Receipts", roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"] },
  { href: "/invoices", label: "Invoices" },
  { href: "/reports", label: "Reports", roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"] },
  { href: "/activity", label: "Activity & Logs" },
];

export default function Sidebar({ role, name, roleLabel }: { role: Role; name: string; roleLabel: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV.filter((i) => !i.roles || i.roles.includes(role));

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login"); router.refresh();
  }

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b">
        <div className="text-lg font-bold text-brand-700">VendorBridge</div>
        <div className="text-[11px] text-slate-400">Procurement ERP</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((i) => {
          const active = pathname === i.href || pathname.startsWith(i.href + "/");
          return (
            <Link key={i.href} href={i.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"}`}>
              {i.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <div className="px-2 py-2">
          <div className="text-sm font-medium text-slate-800 truncate">{name}</div>
          <div className="text-xs text-slate-400">{roleLabel}</div>
        </div>
        <button onClick={logout} className="btn-ghost w-full mt-1 py-1.5 text-sm">Sign out</button>
      </div>
    </aside>
  );
}
