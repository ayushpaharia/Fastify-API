import { api, type HealthStatus, type CriticalEvent, type SparklineData } from "@/lib/api";

export default async function HealthPage() {
  let health: HealthStatus | null = null;
  let events: CriticalEvent[] = [];
  let sparkline: SparklineData | null = null;

  try {
    [health, events, sparkline] = await Promise.all([
      api<HealthStatus>("/api/health"),
      api<CriticalEvent[]>("/api/events"),
      api<SparklineData>("/api/metrics/sparkline"),
    ]);
  } catch {
    // fallback
  }

  const isOperational = health?.status === "operational";
  const services = health?.services ?? {};
  const db = health?.database ?? { status: "unknown", latencyMs: 0 };

  const eventStyles: Record<string, { border: string; bg: string; icon: string; iconColor: string }> = {
    error: { border: "border-error/30", bg: "bg-error/5", icon: "error", iconColor: "text-error" },
    warning: { border: "border-primary/30", bg: "bg-primary/5", icon: "warning", iconColor: "text-primary" },
    info: { border: "border-tertiary/30", bg: "bg-tertiary/5", icon: "info", iconColor: "text-tertiary" },
  };

  return (
    <>
      {/* Header */}
      <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-4">
            <span>System</span>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-secondary-fixed">Health Monitor</span>
          </nav>
          <h2 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight mb-2">System Health</h2>
          <p className="text-on-surface-variant max-w-xl text-lg font-light leading-relaxed">
            Real-time infrastructure status, service health, and recent system events.
          </p>
        </div>
        <div className={`flex items-center gap-3 px-5 py-3 rounded-xl ${isOperational ? "bg-tertiary/10" : "bg-error/10"}`}>
          <div className={`w-3 h-3 rounded-full animate-pulse ${isOperational ? "bg-tertiary shadow-[0_0_12px_rgba(0,228,117,0.6)]" : "bg-error shadow-[0_0_12px_rgba(255,100,100,0.6)]"}`} />
          <span className={`text-sm font-bold uppercase tracking-wider ${isOperational ? "text-tertiary" : "text-error"}`}>
            {isOperational ? "All Systems Operational" : "Degraded Performance"}
          </span>
        </div>
      </section>

      {/* Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface-container-low p-6 rounded-xl">
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Uptime</p>
          <h3 className="text-3xl font-extrabold font-headline text-on-surface">
            {health ? formatUptime(health.uptime) : "—"}
          </h3>
          <p className="mt-2 text-xs text-slate-500">Since last restart</p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl border-l-2 border-tertiary/30">
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">DB Latency</p>
          <h3 className="text-3xl font-extrabold font-headline text-on-surface">{db.latencyMs}ms</h3>
          <p className="mt-2 text-xs text-tertiary font-bold">{db.status}</p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl">
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Endpoints</p>
          <h3 className="text-3xl font-extrabold font-headline text-on-surface">{health?.stats.endpoints ?? 0}</h3>
          <p className="mt-2 text-xs text-slate-500">{health?.stats.users ?? 0} users registered</p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl border-l-2 border-error/30">
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Error Rate (5m)</p>
          <h3 className="text-3xl font-extrabold font-headline text-on-surface">{health?.stats.recentErrorRate ?? "—"}</h3>
          <p className="mt-2 text-xs text-slate-500">{health?.stats.recentRequests ?? 0} recent requests</p>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6">
        {/* Services Grid */}
        <div className="col-span-12 md:col-span-8 bg-surface-container-low rounded-xl p-8">
          <h3 className="text-xl font-bold font-headline text-on-surface mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">dns</span>
            Service Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(services).map(([name, status]) => {
              const ok = status === "operational";
              return (
                <div key={name} className={`p-5 rounded-xl border ${ok ? "border-tertiary/20 bg-tertiary/5" : "border-error/20 bg-error/5"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`material-symbols-outlined ${ok ? "text-tertiary" : "text-error"}`}>
                      {ok ? "check_circle" : "error"}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest ${ok ? "text-tertiary" : "text-error"}`}>
                      {status}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-on-surface capitalize">{name}</p>
                </div>
              );
            })}
          </div>

          {/* Cluster Info */}
          <div className="mt-8 p-5 rounded-xl bg-surface-container-highest/30 border border-outline-variant/10">
            <div className="flex items-center gap-4 text-sm">
              <span className="material-symbols-outlined text-primary">cloud</span>
              <div>
                <span className="font-bold text-on-surface">Cluster </span>
                <code className="bg-surface-variant px-2 py-0.5 rounded text-primary-fixed font-mono text-xs">{health?.cluster ?? "—"}</code>
                <span className="text-slate-400 ml-3">v{health?.version ?? "—"}</span>
              </div>
              <span className="ml-auto text-xs text-slate-500 font-mono">
                {health?.timestamp ? new Date(health.timestamp).toLocaleString() : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Request Activity Sparklines */}
        <div className="col-span-12 md:col-span-4 space-y-6">
          <div className="bg-surface-container-low rounded-xl p-6">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Requests (1h)</h4>
            <div className="h-16 flex items-end gap-1">
              {(sparkline?.requests ?? []).map((v, i) => (
                <div
                  key={i}
                  className={`w-full rounded-t-sm ${i >= 10 ? "bg-primary" : "bg-primary/20"}`}
                  style={{ height: `${Math.max(v, 3)}%` }}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {sparkline?.raw.requests.reduce((a, b) => a + b, 0) ?? 0} total in last hour
            </p>
          </div>

          <div className="bg-surface-container-low rounded-xl p-6">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Errors (1h)</h4>
            <div className="h-16 flex items-end gap-1">
              {(sparkline?.errors ?? []).map((v, i) => (
                <div
                  key={i}
                  className={`w-full rounded-t-sm ${i >= 10 ? "bg-error" : "bg-error/20"}`}
                  style={{ height: `${Math.max(v, 3)}%` }}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {sparkline?.raw.errors.reduce((a, b) => a + b, 0) ?? 0} errors in last hour
            </p>
          </div>
        </div>

        {/* Recent Events */}
        <div className="col-span-12 bg-surface-container-low rounded-xl p-8">
          <h3 className="text-xl font-bold font-headline text-on-surface mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">timeline</span>
            Recent Events
          </h3>
          <div className="space-y-3">
            {events.length === 0 && (
              <p className="text-sm text-slate-500 py-4">No events in the last hour.</p>
            )}
            {events.map((event, i) => {
              const style = eventStyles[event.type] ?? eventStyles.info;
              return (
                <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border ${style.border} ${style.bg}`}>
                  <span className={`material-symbols-outlined mt-0.5 ${style.iconColor}`}>{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-bold text-on-surface">{event.title}</span>
                      <span className="text-[10px] font-mono text-slate-500">{event.timeAgo}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono truncate">{event.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
