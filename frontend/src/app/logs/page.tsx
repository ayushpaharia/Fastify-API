import { api, type LogEntry, type Metric, type Paginated, type CriticalEvent, type SparklineData } from "@/lib/api";

export default async function LogsPage() {
  let logs: LogEntry[] = [];
  let logMetrics: Metric[] = [];
  let events: CriticalEvent[] = [];
  let sparkline: SparklineData | null = null;
  let total = 0;

  try {
    const [logRes, metricsRes, eventsRes, sparkRes] = await Promise.all([
      api<Paginated<LogEntry>>("/api/logs"),
      api<Metric[]>("/api/metrics?category=logs"),
      api<CriticalEvent[]>("/api/events"),
      api<SparklineData>("/api/metrics/sparkline"),
    ]);
    logs = logRes.data;
    total = logRes.pagination.total;
    logMetrics = metricsRes;
    events = eventsRes;
    sparkline = sparkRes;
  } catch {
    // empty
  }

  const barHeights = sparkline?.latency ?? [30, 45, 40, 60, 85, 50, 35, 42, 90, 55, 40, 20];

  const methodColors: Record<string, string> = {
    GET: "text-secondary-fixed",
    POST: "text-primary",
    PATCH: "text-orange-400",
    PUT: "text-primary",
    DELETE: "text-error",
  };

  const selectedLog = logs[0];

  const eventStyles: Record<string, { border: string; bg: string; titleColor: string; textColor: string }> = {
    error: { border: "border-error", bg: "bg-error-container/20", titleColor: "text-error", textColor: "text-on-error-container" },
    warning: { border: "border-orange-400", bg: "bg-orange-400/10", titleColor: "text-orange-400", textColor: "text-on-surface-variant" },
    info: { border: "border-primary", bg: "bg-surface-container-high", titleColor: "text-primary", textColor: "text-on-surface-variant" },
  };

  return (
    <>
      {/* Hero Header */}
      <section className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-on-surface mb-2">Logs &amp; Monitoring</h2>
          <p className="text-secondary-fixed text-lg font-medium opacity-80">Real-time inspection of API transactions and system health.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 rounded-md bg-surface-container-high border border-outline-variant/20 text-on-surface font-semibold text-sm flex items-center gap-2 hover:bg-surface-container-highest transition-all">
            <span className="material-symbols-outlined text-sm">download</span> Export JSON
          </button>
          <button className="px-5 py-2.5 rounded-md bg-linear-to-br from-primary to-primary-container text-on-primary font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/10 hover:scale-[1.02] transition-all">
            <span className="material-symbols-outlined text-sm">pause</span> Pause Stream
          </button>
        </div>
      </section>

      {/* Metrics Bento */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Latency Chart from real sparkline data */}
        <div className="col-span-8 bg-surface-container-low rounded-xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-secondary-fixed font-headline font-semibold">Request Latency</h3>
              <p className="text-xs text-on-surface-variant">Last 60 minutes &bull; {barHeights.length} data points</p>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_#00e475]" />
              <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Live</span>
            </div>
          </div>
          <div className="h-40 flex items-end gap-1">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className={`w-full rounded-t-sm hover:bg-primary transition-colors ${
                  i === barHeights.length - 1 ? "bg-primary" : i >= barHeights.length - 3 ? "bg-primary/30" : "bg-primary/10"
                }`}
                style={{ height: `${Math.max(h, 3)}%` }}
              />
            ))}
          </div>
        </div>

        {/* Live Stats */}
        <div className="col-span-4 grid grid-rows-2 gap-6">
          {logMetrics.map((m) => (
            <div key={m.name} className="bg-surface-container-low rounded-xl p-6 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{m.name}</span>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-headline font-extrabold text-on-surface">{m.value}</span>
                <span className="text-tertiary text-xs font-bold">{m.change}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-low p-4 rounded-xl mb-6 flex items-center gap-4 border border-outline-variant/10">
        <div className="flex-1 flex items-center gap-3">
          <div className="bg-surface-container-high rounded-sm px-3 py-2 flex items-center gap-2 border border-outline-variant/20">
            <span className="material-symbols-outlined text-lg text-slate-400">calendar_today</span>
            <span className="text-sm font-medium">Last 24 hours</span>
          </div>
          <div className="h-6 w-px bg-outline-variant/20" />
          <div className="flex items-center gap-2">
            {["Method: ALL", "Status: ALL", `${total} total`].map((f) => (
              <span key={f} className="px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold uppercase tracking-tighter border border-outline-variant/20 text-on-surface">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Log Stream Table */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/10">
        <div className="bg-surface-container-high px-6 py-4 flex justify-between items-center border-b border-outline-variant/10">
          <div className="flex items-center gap-4">
            <h3 className="font-headline font-bold text-on-surface">Log Stream</h3>
            <span className="text-xs text-on-surface-variant font-mono">Viewing {logs.length} of {total.toLocaleString()} results</span>
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-slate-500 font-bold bg-surface-container-low/50">
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3">Endpoint</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Latency</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {logs.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No log entries yet. Make some API requests to see live data.</td></tr>
              )}
              {logs.map((log) => {
                const isError = log.statusCode >= 400;
                const isSlow = log.latencyMs > 1000;
                return (
                  <tr key={log.id} className="hover:bg-surface-container-high group transition-all cursor-default border-y border-outline-variant/5">
                    <td className="px-6 py-4 text-on-surface-variant">
                      {log.timestamp ? new Date(log.timestamp).toISOString().replace("T", " ").slice(0, 23) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${methodColors[log.method] || "text-slate-400"}`}>{log.method}</span>
                    </td>
                    <td className="px-6 py-4 text-on-surface">{log.endpoint}</td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-2 ${isError ? "text-error" : "text-tertiary-fixed-dim"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isError ? "bg-error shadow-[0_0_6px_rgba(255,180,171,0.4)]" : "bg-tertiary shadow-[0_0_6px_rgba(0,228,117,0.4)]"}`} />
                        {log.statusText}
                      </span>
                    </td>
                    <td className={`px-6 py-4 ${isSlow ? "text-error font-bold italic" : "text-on-surface-variant"}`}>
                      {log.latencyMs}ms
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors">terminal</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="mt-8 grid grid-cols-12 gap-6">
        {/* Critical Events from real /api/events */}
        <div className="col-span-12 md:col-span-4 bg-surface-container-low rounded-xl p-6">
          <h4 className="font-headline font-bold text-secondary-fixed mb-4">Critical Events</h4>
          <div className="space-y-4">
            {events.length === 0 && (
              <p className="text-sm text-slate-500">No events in the last hour.</p>
            )}
            {events.slice(0, 5).map((event, i) => {
              const style = eventStyles[event.type] || eventStyles.info;
              return (
                <div key={i} className={`p-3 ${style.bg} border-l-4 ${style.border} rounded-r-lg`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${style.titleColor}`}>{event.title}</span>
                    <span className="text-[10px] text-slate-500">{event.timeAgo}</span>
                  </div>
                  <p className={`text-sm ${style.textColor}`}>{event.message}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payload Inspector — from real latest log */}
        <div className="col-span-12 md:col-span-8 bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-headline font-bold text-on-surface">Payload Inspector</h4>
            <span className="text-[10px] font-mono text-slate-500 bg-surface-container-high px-2 py-1 rounded-sm">
              REQUEST_ID: {selectedLog?.requestId || "—"}
            </span>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-4 font-mono text-xs text-on-secondary-container leading-relaxed overflow-x-auto h-32 no-scrollbar">
            <pre className="whitespace-pre">
              {selectedLog?.payload ? JSON.stringify(selectedLog.payload, null, 2) : "No log entries yet. Make API requests to see payload data."}
            </pre>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <p className="text-[11px] text-slate-500 italic">
              {selectedLog ? `${selectedLog.method} ${selectedLog.endpoint} — ${selectedLog.statusText} (${selectedLog.latencyMs}ms)` : "Waiting for traffic..."}
            </p>
            <button className="text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary/10 px-3 py-1 rounded-sm transition-all">Copy as Curl</button>
          </div>
        </div>
      </div>
    </>
  );
}
