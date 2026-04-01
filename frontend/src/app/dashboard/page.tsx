import { api, type Metric, type Endpoint, type HealthStatus, type SparklineData } from "@/lib/api";

export default async function DashboardPage() {
  let dashboardMetrics: Metric[] = [];
  let statusMetrics: Metric[] = [];
  let instanceMetrics: Metric[] = [];
  let endpoints: Endpoint[] = [];
  let health: HealthStatus | null = null;
  let sparkline: SparklineData | null = null;

  try {
    const [allMetrics, ep, h, sp] = await Promise.all([
      api<Metric[]>("/api/metrics"),
      api<Endpoint[]>("/api/endpoints"),
      api<HealthStatus>("/api/health"),
      api<SparklineData>("/api/metrics/sparkline"),
    ]);
    dashboardMetrics = allMetrics.filter((m) => m.category === "dashboard");
    statusMetrics = allMetrics.filter((m) => m.category === "status_codes");
    instanceMetrics = allMetrics.filter((m) => m.category === "instance");
    endpoints = ep;
    health = h;
    sparkline = sp;
  } catch {
    // Fallback
  }

  const metricConfigs = [
    { label: "Total Requests", icon: "trending_up", isError: false,
      barFull: "bg-primary", barMid: "bg-primary/40", barLow: "bg-primary/20",
      bars: sparkline?.requests ?? [10, 20, 15, 30, 25, 40, 35, 50, 45, 60, 55, 70] },
    { label: "Avg Latency", icon: "trending_down", isError: false,
      barFull: "bg-secondary", barMid: "bg-secondary/40", barLow: "bg-secondary/20",
      bars: sparkline?.latency ?? [80, 70, 75, 60, 50, 45, 40, 35, 30, 25, 20, 15] },
    { label: "Error Rate", icon: "warning", isError: true,
      barFull: "bg-error", barMid: "bg-error/40", barLow: "bg-error/10",
      bars: sparkline?.errors ?? [5, 3, 4, 2, 1, 3, 2, 1, 0, 1, 0, 2] },
  ];

  const methodColors: Record<string, string> = {
    GET: "bg-tertiary-container/30 text-tertiary-fixed",
    POST: "bg-primary-container/30 text-primary",
    PATCH: "bg-outline-variant/30 text-slate-400",
    PUT: "bg-primary-container/30 text-primary",
    DELETE: "bg-error-container/30 text-error",
  };

  const systemStatus = health?.status === "operational";

  return (
    <>
      {/* Hero Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-secondary-fixed font-semibold mb-2">System Overview</h2>
          <h3 className="text-4xl font-extrabold tracking-tight font-headline text-on-surface">
            API Performance <span className="text-primary">Live</span>
          </h3>
        </div>
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${systemStatus ? "bg-surface-container-low" : "bg-error-container/20"}`}>
          <div className={`w-2 h-2 rounded-full ${systemStatus ? "bg-tertiary shadow-[0_0_8px_rgba(0,228,117,0.6)]" : "bg-error shadow-[0_0_8px_rgba(255,180,171,0.6)]"}`} />
          <span className={`text-xs font-mono font-medium uppercase tracking-wider ${systemStatus ? "text-tertiary" : "text-error"}`}>
            {systemStatus ? "All Systems Operational" : "Degraded"}
          </span>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Metric Cards with live sparklines */}
        {metricConfigs.map((cfg, i) => {
          const metric = dashboardMetrics[i];
          return (
            <div key={cfg.label} className="col-span-12 md:col-span-4 bg-surface-container-low rounded-xl p-6 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">{cfg.label}</p>
                  <h4 className="text-4xl font-extrabold font-headline">{metric?.value ?? "—"}</h4>
                </div>
                <span className={`${cfg.isError ? "text-error bg-error-container/20" : "text-tertiary-fixed-dim bg-tertiary-container/20"} text-xs font-bold flex items-center px-2 py-1 rounded-md`}>
                  <span className="material-symbols-outlined text-sm mr-1">{cfg.icon}</span>
                  {metric?.change ?? ""}
                </span>
              </div>
              <div className="h-16 flex items-end gap-1">
                {cfg.bars.map((h, j) => (
                  <div
                    key={j}
                    className={`w-full rounded-t-sm ${
                      j >= cfg.bars.length - 2
                        ? j === cfg.bars.length - 1 ? cfg.barFull : cfg.barMid
                        : cfg.barLow
                    }`}
                    style={{ height: `${Math.max(h, 3)}%` }}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Active Endpoints with live stats */}
        <div className="col-span-12 md:col-span-8 bg-surface-container-low rounded-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h5 className="text-xl font-bold font-headline">Active Endpoints</h5>
            <span className="text-xs text-slate-500 font-mono">{endpoints.length} registered</span>
          </div>
          <div className="space-y-4">
            {endpoints.slice(0, 4).map((ep) => (
              <div key={ep.id} className="group flex items-center justify-between gap-4 p-4 rounded-xl hover:bg-surface-container-highest transition-all duration-200">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <span className={`font-mono text-xs font-bold px-3 py-1 rounded-md shrink-0 ${methodColors[ep.method] || "bg-outline-variant/30 text-slate-400"}`}>
                    {ep.method}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium text-slate-100 truncate">{ep.path}</p>
                    <p className="text-xs text-slate-500 mt-1">{ep.category} &bull; {ep.reqPerMin} req/min</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Latency</p>
                    <p className="text-sm font-mono text-secondary-fixed">{ep.latencyMs}ms</p>
                  </div>
                  <div className="w-20 h-1 bg-surface-variant rounded-full overflow-hidden">
                    <div className={`h-full ${ep.uptimePct >= 90 ? "bg-tertiary" : "bg-primary"}`} style={{ width: `${ep.uptimePct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 md:col-span-4 space-y-6">
          {/* Status Codes from live data */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <h5 className="text-sm font-bold font-headline mb-6 text-slate-400 uppercase tracking-widest">Status Codes (24h)</h5>
            <div className="flex h-3 w-full rounded-full overflow-hidden mb-6">
              {statusMetrics.map((sm) => {
                const colors: Record<string, string> = { "2xx Success": "bg-tertiary", "4xx Client Error": "bg-primary", "5xx Server Error": "bg-error" };
                const pct = parseFloat(sm.value) || 0;
                return <div key={sm.name} className={`h-full ${colors[sm.name] || "bg-slate-500"}`} style={{ width: `${pct}%` }} />;
              })}
            </div>
            <div className="space-y-3">
              {statusMetrics.map((sm) => {
                const colors: Record<string, string> = { "2xx Success": "bg-tertiary", "4xx Client Error": "bg-primary", "5xx Server Error": "bg-error" };
                return (
                  <div key={sm.name} className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${colors[sm.name] || "bg-slate-500"}`} />
                      {sm.name}
                    </span>
                    <span className="font-mono">{sm.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instance Health from real process stats */}
          <div className="glass-card rounded-xl p-6 border border-outline-variant/10">
            <h5 className="text-sm font-bold font-headline mb-6 text-slate-400 uppercase tracking-widest">Instance Health</h5>
            <div className="space-y-5">
              {instanceMetrics.map((im) => {
                const isMemory = im.name.includes("Memory");
                const pctMatch = im.value.match(/^(\d+)/);
                const pct = pctMatch ? parseInt(pctMatch[1]) : 0;
                const color = isMemory ? "bg-primary" : "bg-tertiary";
                const textColor = isMemory ? "text-primary" : "text-tertiary-fixed";
                return (
                  <div key={im.name}>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-100 font-medium">{im.name}</span>
                      <span className={`${textColor} font-mono`}>{im.value}</span>
                    </div>
                    <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div className={`h-full ${color}`} style={{ width: `${isMemory ? Math.round(pct / 1.5) : pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {health && (
                <div className="pt-2 text-xs text-slate-500 font-mono">
                  DB: {health.database.status} ({health.database.latencyMs}ms) &bull; Uptime: {Math.round(health.uptime)}s
                </div>
              )}
              <div className="pt-1">
                <button className="w-full py-2.5 rounded-lg border border-outline/20 text-slate-100 text-xs font-bold hover:bg-surface-variant transition-colors">
                  Open Instance Manager
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Update Ticker — from real health data */}
        <div className="col-span-12 bg-surface-container-lowest rounded-xl p-6 border-l-4 border-primary">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary">info</span>
            <p className="text-sm text-slate-300">
              <span className="font-bold text-on-surface">Live Status:</span> Cluster{" "}
              <code className="bg-surface-variant px-1.5 py-0.5 rounded text-primary-fixed">{health?.cluster || "—"}</code>{" "}
              running v{health?.version || "—"} &bull; {health?.stats.endpoints || 0} endpoints, {health?.stats.users || 0} users, {health?.stats.recentRequests || 0} recent requests
            </p>
            <span className="ml-auto text-xs font-mono text-slate-500">{health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : ""}</span>
          </div>
        </div>
      </div>
    </>
  );
}
