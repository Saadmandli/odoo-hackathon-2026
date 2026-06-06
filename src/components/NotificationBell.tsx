"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fmtDateTime } from "@/lib/utils";

type N = { id: string; type: string; message: string; read: boolean; link?: string | null; createdAt: string };

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<N[]>([]);
  const unread = items.filter((i) => !i.read).length;

  async function load() {
    const res = await fetch("/api/notifications");
    if (res.ok) { const d = await res.json(); setItems(d.notifications); }
  }
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, []);

  async function markRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setItems((x) => x.map((i) => ({ ...i, read: true })));
  }

  return (
    <div className="relative">
      <button onClick={() => { setOpen((o) => !o); if (!open && unread) markRead(); }} className="relative btn-ghost px-3 py-2">
        <span>🔔</span>
        {unread > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 card p-2 z-50 max-h-96 overflow-y-auto">
          <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase">Notifications</div>
          {items.length === 0 && <div className="px-3 py-6 text-sm text-slate-400 text-center">No notifications</div>}
          {items.map((n) => (
            <Link key={n.id} href={n.link || "#"} onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm hover:bg-slate-50 ${!n.read ? "bg-brand-50/50" : ""}`}>
              <div className="text-slate-700">{n.message}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{fmtDateTime(n.createdAt)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
