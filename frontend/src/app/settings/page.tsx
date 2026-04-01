import { api, type HealthStatus } from "@/lib/api";

interface Webhook {
  id: number;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  lastTriggered: string | null;
  lastStatus: number | null;
}

export default async function SettingsPage() {
  let health: HealthStatus | null = null;
  let webhooks: Webhook[] = [];

  try {
    [health, webhooks] = await Promise.all([
      api<HealthStatus>("/api/health"),
      api<Webhook[]>("/api/webhooks"),
    ]);
  } catch {}

  const webhookEvents = [
    { id: "log.error", label: "Error Logs", desc: "When a 4xx/5xx response is logged" },
    { id: "log.slow", label: "Slow Requests", desc: "When latency exceeds threshold" },
    { id: "health.degraded", label: "Health Degraded", desc: "When system status changes" },
    { id: "ingestion.error", label: "Ingestion Errors", desc: "When external logs report errors" },
    { id: "*", label: "All Events", desc: "Subscribe to everything" },
  ];

  return (
    <>
      {/* Header */}
      <section className="mb-10">
        <nav className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-4">
          <span>System</span>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <span className="text-secondary-fixed">Settings</span>
        </nav>
        <h2 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight mb-2">Settings</h2>
        <p className="text-on-surface-variant max-w-xl text-lg font-light leading-relaxed">
          Configure API keys, webhooks, and system preferences.
        </p>
      </section>

      <div className="grid grid-cols-12 gap-6">
        {/* API Configuration */}
        <div className="col-span-12 md:col-span-8 space-y-6">
          {/* API Keys */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <h3 className="text-lg font-bold font-headline text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">key</span>
              API Keys
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-container-high/40 rounded-lg">
                <div>
                  <p className="text-sm font-bold text-on-surface">Production Key</p>
                  <p className="font-mono text-xs text-slate-500 mt-1">fapi_prod_••••••••••••••••</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-xs font-bold text-slate-400 border border-outline-variant/20 rounded-lg hover:bg-surface-container-highest transition-colors">Reveal</button>
                  <button className="px-3 py-1.5 text-xs font-bold text-primary border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors">Rotate</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-surface-container-high/40 rounded-lg">
                <div>
                  <p className="text-sm font-bold text-on-surface">Development Key</p>
                  <p className="font-mono text-xs text-slate-500 mt-1">fapi_dev_••••••••••••••••</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-xs font-bold text-slate-400 border border-outline-variant/20 rounded-lg hover:bg-surface-container-highest transition-colors">Reveal</button>
                  <button className="px-3 py-1.5 text-xs font-bold text-primary border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors">Rotate</button>
                </div>
              </div>
            </div>
          </div>

          {/* Webhooks */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold font-headline text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">webhook</span>
                Webhooks
              </h3>
              <button className="px-4 py-2 bg-linear-to-br from-primary to-primary-container text-on-primary rounded-lg font-bold text-xs transition-transform active:scale-95">
                + Add Webhook
              </button>
            </div>

            {webhooks.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-4xl text-slate-600 mb-3 block">webhook</span>
                <p className="text-slate-500 text-sm mb-2">No webhooks configured</p>
                <p className="text-slate-600 text-xs">Create a webhook to receive notifications for API events.</p>
                <div className="mt-4 bg-surface-container-high/40 rounded-lg p-4 max-w-md mx-auto text-left">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold">Quick Start</p>
                  <code className="text-xs font-mono text-primary block">
                    curl -X POST localhost:4000/api/webhooks \<br/>
                    &nbsp;&nbsp;-H &quot;Content-Type: application/json&quot; \<br/>
                    &nbsp;&nbsp;-d &apos;{`{"name":"my-hook","url":"https://..."}`}&apos;
                  </code>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {webhooks.map((wh) => (
                  <div key={wh.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-surface-container-highest transition-all border border-outline-variant/5">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${wh.active ? "bg-tertiary shadow-[0_0_6px_rgba(0,228,117,0.4)]" : "bg-slate-600"}`} />
                      <div>
                        <p className="text-sm font-bold text-on-surface">{wh.name}</p>
                        <p className="font-mono text-xs text-slate-500 truncate max-w-[300px]">{wh.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500">{wh.events?.length || 0} events</p>
                        {wh.lastTriggered && (
                          <p className="text-[10px] text-slate-600">Last: {wh.lastStatus === 200 ? "OK" : `${wh.lastStatus}`}</p>
                        )}
                      </div>
                      <button className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-sm">edit</span>
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
                {webhookEvents.map((evt) => (
                  <div key={evt.id} className="flex items-center gap-3 p-3 bg-surface-container-high/30 rounded-lg">
                    <code className="text-[10px] font-mono text-primary">{evt.id}</code>
                    <span className="text-xs text-slate-400">{evt.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ingestion Endpoint */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <h3 className="text-lg font-bold font-headline text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-fixed">input</span>
              Log Ingestion
            </h3>
            <p className="text-sm text-slate-400 mb-4">Push external logs into the dashboard from any service.</p>
            <div className="bg-surface-container-lowest rounded-lg p-4 font-mono text-xs">
              <p className="text-slate-500 mb-2"># Single log entry</p>
              <pre className="text-primary">{`POST /api/ingest
Content-Type: application/json

{
  "source": "payment-service",
  "level": "error",
  "message": "Payment gateway timeout",
  "metadata": { "orderId": "ORD-123" }
}`}</pre>
              <p className="text-slate-500 mt-4 mb-2"># Batch (up to 100)</p>
              <pre className="text-primary">{`POST /api/ingest
[{ "source": "...", "message": "..." }, ...]`}</pre>
            </div>
            <div className="mt-4 flex gap-4 text-xs text-slate-500">
              <span>Levels: <code className="text-primary">debug</code> <code className="text-secondary-fixed">info</code> <code className="text-orange-400">warn</code> <code className="text-error">error</code> <code className="text-error font-bold">fatal</code></span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 md:col-span-4 space-y-6">
          {/* System Info */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <h3 className="text-sm font-bold font-headline text-slate-400 uppercase tracking-widest mb-6">System Info</h3>
            <div className="space-y-4">
              {[
                { label: "Version", value: health?.version || "—" },
                { label: "Cluster", value: health?.cluster || "—" },
                { label: "DB Status", value: health?.database.status || "—" },
                { label: "DB Latency", value: health ? `${health.database.latencyMs}ms` : "—" },
                { label: "Uptime", value: health ? `${Math.round(health.uptime / 60)}min` : "—" },
                { label: "Endpoints", value: String(health?.stats.endpoints || 0) },
                { label: "Users", value: String(health?.stats.users || 0) },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="font-mono text-on-surface">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rate Limits */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <h3 className="text-sm font-bold font-headline text-slate-400 uppercase tracking-widest mb-6">Rate Limits</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-100">Global (read)</span>
                  <span className="font-mono text-primary">30 req/min</span>
                </div>
                <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[60%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-100">Writes (POST/PATCH)</span>
                  <span className="font-mono text-tertiary">10 req/min</span>
                </div>
                <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary w-[30%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-100">Ban after</span>
                  <span className="font-mono text-error">5 violations</span>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-surface-container-low rounded-xl p-6 border border-error/10">
            <h3 className="text-sm font-bold text-error uppercase tracking-widest mb-4">Danger Zone</h3>
            <div className="space-y-3">
              <button className="w-full py-2.5 rounded-lg border border-error/20 text-error text-xs font-bold hover:bg-error/10 transition-colors">
                Revoke All API Keys
              </button>
              <button className="w-full py-2.5 rounded-lg border border-error/20 text-error text-xs font-bold hover:bg-error/10 transition-colors">
                Purge Log Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
