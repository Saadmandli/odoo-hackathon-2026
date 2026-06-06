"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { fmtDateTime } from "@/lib/utils";

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/activity").then((r) => r.json()).then((d) => setLogs(d.logs || []));
    fetch("/api/notifications").then((r) => r.json()).then((d) => setNotifs(d.notifications || []));
  }, []);

  return (
    <div>
      <PageHeader title="Activity & Notifications" subtitle="Audit trail of procurement actions and your alerts." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="px-5 py-3 border-b font-semibold">Audit Log</div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {logs.length === 0 && <div className="px-5 py-8 text-center text-slate-400 text-sm">No activity logged.</div>}
            {logs.map((l) => (
              <div key={l.id} className="px-5 py-3 flex items-start gap-3">
                <span className="badge bg-slate-100 text-slate-600 shrink-0">{l.action}</span>
                <div className="text-sm">
                  <div className="text-slate-700">{l.message}</div>
                  <div className="text-xs text-slate-400">{l.user?.name || "System"} · {l.entityType} · {fmtDateTime(l.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="px-5 py-3 border-b font-semibold">Your Notifications</div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {notifs.length === 0 && <div className="px-5 py-8 text-center text-slate-400 text-sm">No notifications.</div>}
            {notifs.map((n) => (
              <div key={n.id} className="px-5 py-3">
                <div className="text-sm text-slate-700">{n.message}</div>
                <div className="text-xs text-slate-400 mt-0.5">{n.type} · {fmtDateTime(n.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
