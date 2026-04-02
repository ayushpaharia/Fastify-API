"use client";

import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface CriticalEvent {
  type: "error" | "warning" | "info";
  title: string;
  message: string;
  timeAgo: string;
}

const WEBHOOK_EVENTS = [
  { id: "log.error", label: "Error Logs" },
  { id: "log.slow", label: "Slow Requests" },
  { id: "health.degraded", label: "Health Degraded" },
  { id: "ingestion.error", label: "Ingestion Errors" },
  { id: "*", label: "All Events" },
];

const eventStyles = {
  error: { border: "border-error", bg: "bg-error-container/20", titleColor: "text-error" },
  warning: { border: "border-orange-400", bg: "bg-orange-400/10", titleColor: "text-orange-400" },
  info: { border: "border-primary", bg: "bg-surface-container-high", titleColor: "text-primary" },
};

export default function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [events, setEvents] = useState<CriticalEvent[]>([]);
  const [tab, setTab] = useState<"events" | "subscribe">("events");
  const [form, setForm] = useState({ name: "", url: "", secret: "", events: [] as string[] });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      fetch(`${API_BASE}/api/events`)
        .then((r) => r.json())
        .then(setEvents)
        .catch(() => {});
    }
  }, [open]);

  const toggleEvent = (id: string) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(id) ? f.events.filter((e) => e !== id) : [...f.events, id],
    }));
  };

  const handleSubscribe = async () => {
    if (!form.name || !form.url) { setError("Name and URL are required"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, url: form.url, secret: form.secret || undefined, events: form.events }),
      });
      if (!res.ok) throw new Error("Failed to create webhook");
      setSuccess(true);
      setForm({ name: "", url: "", secret: "", events: [] });
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to create webhook. Check the URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-96 z-50 bg-[#0d1628] border-l border-outline-variant/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">notifications</span>
            <h2 className="font-headline font-bold text-on-surface">Notifications</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant/10">
          <button
            onClick={() => setTab("events")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${tab === "events" ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-300"}`}
          >
            Recent Events
          </button>
          <button
            onClick={() => setTab("subscribe")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${tab === "subscribe" ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-300"}`}
          >
            Subscribe
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === "events" ? (
            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-3xl text-slate-600 mb-2 block">notifications_none</span>
                  <p className="text-slate-500 text-sm">No recent events</p>
                </div>
              ) : (
                events.slice(0, 10).map((evt, i) => {
                  const style = eventStyles[evt.type] || eventStyles.info;
                  return (
                    <div key={i} className={`p-3 ${style.bg} border-l-4 ${style.border} rounded-r-lg`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-bold uppercase tracking-wider ${style.titleColor}`}>{evt.title}</span>
                        <span className="text-[10px] text-slate-500">{evt.timeAgo}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant">{evt.message}</p>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-xs text-slate-400 leading-relaxed">
                Create a webhook to receive real-time notifications when API events occur.
              </p>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="my-alerts"
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-slate-600 focus:ring-1 focus:ring-primary/40 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Webhook URL *</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://hooks.example.com/..."
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-slate-600 focus:ring-1 focus:ring-primary/40 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Secret (optional)</label>
                <input
                  value={form.secret}
                  onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
                  placeholder="HMAC signing secret"
                  type="password"
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-slate-600 focus:ring-1 focus:ring-primary/40 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Events</label>
                <div className="space-y-2">
                  {WEBHOOK_EVENTS.map((evt) => (
                    <label key={evt.id} className="flex items-center gap-3 cursor-pointer group">
                      <div
                        onClick={() => toggleEvent(evt.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                          form.events.includes(evt.id) ? "bg-primary border-primary" : "border-outline-variant/40 hover:border-primary/50"
                        }`}
                      >
                        {form.events.includes(evt.id) && <span className="material-symbols-outlined text-on-primary text-xs">check</span>}
                      </div>
                      <div>
                        <span className="text-xs font-mono text-primary">{evt.id}</span>
                        <span className="text-xs text-slate-500 ml-2">{evt.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {error && <p className="text-xs text-error">{error}</p>}
              {success && <p className="text-xs text-tertiary">Webhook created successfully!</p>}
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full py-3 bg-linear-to-br from-primary to-primary-container text-on-primary rounded-xl font-bold text-sm disabled:opacity-50 transition-transform active:scale-95"
              >
                {loading ? "Creating..." : "Create Webhook"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
