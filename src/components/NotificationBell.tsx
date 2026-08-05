"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fmtDateTime } from "@/lib/utils";

type N = { id: string; type: string; message: string; read: boolean; link?: string | null; createdAt: string };

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<N[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const unread = items.filter((i) => !i.read).length;

  async function load() {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const d = await res.json();
      setItems(d.notifications || []);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  // Click outside listener to automatically close notification popover
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  async function markRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setItems((x) => x.map((i) => ({ ...i, read: true })));
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unread) markRead();
        }}
        className="relative btn-ghost px-3 py-2"
        aria-label="View notifications"
      >
        <span>🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center shadow-xs">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 card p-2 z-50 max-h-96 overflow-y-auto shadow-xl border border-slate-200 bg-white space-y-1">
          <div className="px-3 py-2 border-b text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
            <span>Your Notifications</span>
            {unread > 0 && (
              <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded font-semibold">
                {unread} unread
              </span>
            )}
          </div>
          {items.length === 0 && (
            <div className="px-3 py-6 text-sm text-slate-400 text-center">No notifications yet</div>
          )}
          {items.map((n) => (
            <Link
              key={n.id}
              href={n.link || "#"}
              onClick={() => setOpen(false)}
              className={`block rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors ${
                !n.read ? "bg-brand-50/70 border-l-2 border-l-brand-600" : ""
              }`}
            >
              <div className="text-slate-800 font-medium leading-snug">{n.message}</div>
              <div className="text-[11px] text-slate-400 mt-1 flex justify-between items-center">
                <span className="font-semibold text-brand-600">{n.type}</span>
                <span>{fmtDateTime(n.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
