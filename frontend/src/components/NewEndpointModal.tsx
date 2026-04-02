"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const METHODS = ["GET", "POST", "PATCH", "PUT", "DELETE"];
const CATEGORIES = ["analytics", "auth", "endpoints", "users", "logs", "health", "webhooks", "ingestion", "other"];

export default function NewEndpointModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [form, setForm] = useState({ method: "GET", path: "", description: "", category: "other" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!form.path) { setError("Path is required"); return; }
    if (!form.path.startsWith("/")) { setError("Path must start with /"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/endpoints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: form.method,
          path: form.path,
          description: form.description || null,
          category: form.category,
        }),
      });
      if (!res.ok) throw new Error("Failed to create endpoint");
      setSuccess(true);
      setForm({ method: "GET", path: "", description: "", category: "other" });
      onCreated?.();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch {
      setError("Failed to create endpoint. Check the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const methodColors: Record<string, string> = {
    GET: "text-tertiary-fixed",
    POST: "text-primary",
    PATCH: "text-orange-400",
    PUT: "text-primary",
    DELETE: "text-error",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-[#0d1628] border border-outline-variant/20 rounded-2xl shadow-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">add_circle</span>
            </div>
            <div>
              <h2 className="font-headline font-extrabold text-on-surface text-lg">Register Endpoint</h2>
              <p className="text-xs text-slate-500">Add a new endpoint to the dashboard</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-5">
          {/* Method + Path */}
          <div className="flex gap-3">
            <div className="w-36">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Method</label>
              <select
                value={form.method}
                onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
                className={`w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2.5 text-sm font-bold outline-none focus:ring-1 focus:ring-primary/40 ${methodColors[form.method]}`}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m} className="text-on-surface font-bold">{m}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Path *</label>
              <input
                value={form.path}
                onChange={(e) => setForm((f) => ({ ...f, path: e.target.value }))}
                placeholder="/api/my-endpoint"
                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2.5 text-sm font-mono text-on-surface placeholder:text-slate-600 focus:ring-1 focus:ring-primary/40 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What does this endpoint do?"
              className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-slate-600 focus:ring-1 focus:ring-primary/40 outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary/40"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="mt-4 text-xs text-error">{error}</p>}
        {success && <p className="mt-4 text-xs text-tertiary font-bold">Endpoint registered successfully!</p>}

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-outline-variant/20 text-slate-400 font-bold text-sm hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || success}
            className="flex-1 py-3 rounded-xl bg-linear-to-br from-primary to-primary-container text-on-primary font-extrabold text-sm disabled:opacity-50 transition-transform active:scale-95"
          >
            {loading ? "Registering..." : success ? "Done!" : "Register Endpoint"}
          </button>
        </div>
      </div>
    </div>
  );
}
