"use client";

import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Webhook {
  id: number;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  lastTriggered: string | null;
  lastStatus: number | null;
}

const WEBHOOK_EVENTS = [
  { id: "log.error", label: "Error Logs", desc: "When a 4xx/5xx response is logged" },
  { id: "log.slow", label: "Slow Requests", desc: "When latency exceeds threshold" },
  { id: "health.degraded", label: "Health Degraded", desc: "When system status changes" },
  { id: "ingestion.error", label: "Ingestion Errors", desc: "When external logs report errors" },
  { id: "*", label: "All Events", desc: "Subscribe to everything" },
];

function WebhookModal({
  webhook,
  onClose,
  onSaved,
}: {
  webhook: Webhook | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: webhook?.name ?? "",
    url: webhook?.url ?? "",
    secret: "",
    events: webhook?.events ?? [],
    active: webhook?.active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleEvent = (id: string) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(id) ? f.events.filter((e) => e !== id) : [...f.events, id],
    }));
  };

  const handleSave = async () => {
    if (!form.name || !form.url) { setError("Name and URL are required"); return; }
    setLoading(true);
    setError("");
    try {
      const url = webhook ? `${API_BASE}/api/webhooks/${webhook.id}` : `${API_BASE}/api/webhooks`;
      const method = webhook ? "PATCH" : "POST";
      const body: Record<string, unknown> = { name: form.name, url: form.url, events: form.events, active: form.active };
      if (form.secret) body.secret = form.secret;
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed");
      onSaved();
      onClose();
    } catch {
      setError("Failed to save webhook.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-[#0d1628] border border-outline-variant/20 rounded-2xl shadow-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline font-extrabold text-on-surface text-lg">
            {webhook ? "Edit Webhook" : "Add Webhook"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Name *</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="my-webhook"
              className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-slate-600 focus:ring-1 focus:ring-primary/40 outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Endpoint URL *</label>
            <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://hooks.example.com/..."
              className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-slate-600 focus:ring-1 focus:ring-primary/40 outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Secret (HMAC signing)</label>
            <input value={form.secret} onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
              placeholder={webhook ? "Leave blank to keep existing" : "Optional signing secret"}
              type="password"
              className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-slate-600 focus:ring-1 focus:ring-primary/40 outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Events</label>
            <div className="grid grid-cols-2 gap-2">
              {WEBHOOK_EVENTS.map((evt) => (
                <label key={evt.id} onClick={() => toggleEvent(evt.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer border transition-colors ${
                    form.events.includes(evt.id) ? "border-primary/50 bg-primary/10" : "border-outline-variant/20 hover:border-outline-variant/40"
                  }`}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    form.events.includes(evt.id) ? "bg-primary border-primary" : "border-outline-variant/40"
                  }`}>
                    {form.events.includes(evt.id) && <span className="material-symbols-outlined text-on-primary text-xs">check</span>}
                  </div>
                  <span className="text-xs font-mono text-primary truncate">{evt.id}</span>
                </label>
              ))}
            </div>
          </div>
          {webhook && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${form.active ? "bg-tertiary" : "bg-slate-600"}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.active ? "translate-x-5" : ""}`} />
              </div>
              <span className="text-sm text-on-surface">{form.active ? "Active" : "Inactive"}</span>
            </label>
          )}
        </div>
        {error && <p className="mt-3 text-xs text-error">{error}</p>}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-outline-variant/20 text-slate-400 font-bold text-sm hover:bg-surface-container-high transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-3 rounded-xl bg-linear-to-br from-primary to-primary-container text-on-primary font-extrabold text-sm disabled:opacity-50 active:scale-95">
            {loading ? "Saving..." : webhook ? "Update Webhook" : "Create Webhook"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WebhooksSection({ initialWebhooks }: { initialWebhooks: Webhook[] }) {
  const [webhooks, setWebhooks] = useState<Webhook[]>(initialWebhooks);
  const [modalWebhook, setModalWebhook] = useState<Webhook | null | "new">(null);
  const [toastMsg, setToastMsg] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);

  const refresh = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/webhooks`);
      setWebhooks(await res.json());
    } catch {}
  };

  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this webhook?")) return;
    setDeletingId(id);
    try {
      await fetch(`${API_BASE}/api/webhooks/${id}`, { method: "DELETE" });
      await refresh();
      toast("Webhook deleted.");
    } catch {
      toast("Failed to delete webhook.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/webhooks/${id}/test`, { method: "POST" });
      const data = await res.json();
      toast(`Test sent — status: ${data.status ?? "unknown"}`);
    } catch {
      toast("Test delivery failed.");
    } finally {
      setTestingId(null);
    }
  };

  useEffect(() => {
    if (!modalWebhook) refresh();
  }, [modalWebhook]);

  return (
    <>
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-highest border border-outline-variant/20 rounded-xl px-4 py-3 shadow-2xl text-sm font-medium text-on-surface">
          {toastMsg}
        </div>
      )}

      <div className="bg-surface-container-low rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold font-headline text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">webhook</span>
            Webhooks
          </h3>
          <button
            onClick={() => setModalWebhook("new")}
            className="px-4 py-2 bg-linear-to-br from-primary to-primary-container text-on-primary rounded-lg font-bold text-xs transition-transform active:scale-95"
          >
            + Add Webhook
          </button>
        </div>

        {webhooks.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-3 block">webhook</span>
            <p className="text-slate-500 text-sm mb-2">No webhooks configured</p>
            <p className="text-slate-600 text-xs">Create a webhook to receive notifications for API events.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map((wh) => (
              <div key={wh.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-surface-container-highest transition-all border border-outline-variant/5">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${wh.active ? "bg-tertiary shadow-[0_0_6px_rgba(0,228,117,0.4)]" : "bg-slate-600"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-on-surface">{wh.name}</p>
                    <p className="font-mono text-xs text-slate-500 truncate max-w-[260px]">{wh.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500">{wh.events?.length || 0} events</p>
                    {wh.lastTriggered && (
                      <p className="text-[10px] text-slate-600">Last: {wh.lastStatus === 200 ? "✓ OK" : `${wh.lastStatus}`}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleTest(wh.id)}
                    disabled={testingId === wh.id}
                    title="Test delivery"
                    className="p-1.5 text-slate-400 hover:text-tertiary transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                  </button>
                  <button
                    onClick={() => setModalWebhook(wh)}
                    title="Edit"
                    className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(wh.id)}
                    disabled={deletingId === wh.id}
                    title="Delete"
                    className="p-1.5 text-slate-400 hover:text-error transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Available events */}
        <div className="mt-6 pt-6 border-t border-outline-variant/10">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Available Events</h4>
          <div className="grid grid-cols-2 gap-2">
            {WEBHOOK_EVENTS.map((evt) => (
              <div key={evt.id} className="flex items-center gap-3 p-3 bg-surface-container-high/30 rounded-lg">
                <code className="text-[10px] font-mono text-primary">{evt.id}</code>
                <span className="text-xs text-slate-400">{evt.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalWebhook !== null && (
        <WebhookModal
          webhook={modalWebhook === "new" ? null : modalWebhook}
          onClose={() => setModalWebhook(null)}
          onSaved={refresh}
        />
      )}
    </>
  );
}
