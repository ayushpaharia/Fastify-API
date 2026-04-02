import { api, type HealthStatus } from "@/lib/api";
import WebhooksSection from "@/components/WebhooksSection";
import ApiKeySection from "@/components/ApiKeySection";

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
          {/* API Keys — client island */}
          <ApiKeySection />

          {/* Webhooks — client island */}
          <WebhooksSection initialWebhooks={webhooks} />

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
              <button
                onClick={() => confirm("Revoke all API keys? This cannot be undone.") && alert("This is a demo — keys are display-only.")}
                className="w-full py-2.5 rounded-lg border border-error/20 text-error text-xs font-bold hover:bg-error/10 transition-colors"
              >
                Revoke All API Keys
              </button>
              <button
                onClick={() => confirm("Purge all log data? This cannot be undone.")}
                className="w-full py-2.5 rounded-lg border border-error/20 text-error text-xs font-bold hover:bg-error/10 transition-colors"
              >
                Purge Log Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
