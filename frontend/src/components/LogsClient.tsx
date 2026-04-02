"use client";

import { useState, useEffect, useCallback } from "react";
import type { LogEntry, CriticalEvent, Metric, SparklineData } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type ChartType = "bar" | "candlestick";

interface Candle {
  open: number;
  close: number;
  high: number;
  low: number;
}

const methodColors: Record<string, string> = {
  GET: "text-secondary-fixed",
  POST: "text-primary",
  PATCH: "text-orange-400",
  PUT: "text-primary",
  DELETE: "text-error",
};

const eventStyles: Record<string, { border: string; bg: string; titleColor: string; textColor: string }> = {
  error: { border: "border-error", bg: "bg-error-container/20", titleColor: "text-error", textColor: "text-on-error-container" },
  warning: { border: "border-orange-400", bg: "bg-orange-400/10", titleColor: "text-orange-400", textColor: "text-on-surface-variant" },
  info: { border: "border-primary", bg: "bg-surface-container-high", titleColor: "text-primary", textColor: "text-on-surface-variant" },
};

function buildCandles(data: number[]): Candle[] {
  const candles: Candle[] = [];
  for (let i = 0; i < data.length - 1; i += 2) {
    const a = data[i];
    const b = data[i + 1] ?? a;
    candles.push({ open: a, close: b, high: Math.max(a, b) + Math.random() * 10, low: Math.min(a, b) - Math.random() * 5 });
  }
  return candles;
}

export default function LogsClient({
  initialLogs,
  initialTotal,
  initialEvents,
  initialMetrics,
  initialSparkline,
}: {
  initialLogs: LogEntry[];
  initialTotal: number;
  initialEvents: CriticalEvent[];
  initialMetrics: Metric[];
  initialSparkline: SparklineData | null;
}) {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [total, setTotal] = useState(initialTotal);
  const [events] = useState<CriticalEvent[]>(initialEvents);
  const [logMetrics] = useState<Metric[]>(initialMetrics);
  const [sparkline] = useState<SparklineData | null>(initialSparkline);

  const [chartType, setChartType] = useState<ChartType>("bar");
  const [paused, setPaused] = useState(false);
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(initialLogs[0] ?? null);

  const barHeights = sparkline?.latency ?? [30, 45, 40, 60, 85, 50, 35, 42, 90, 55, 40, 20];
  const candles = buildCandles(barHeights);

  const fetchLogs = useCallback(async (method: string, status: string) => {
    const params = new URLSearchParams();
    if (method !== "ALL") params.set("method", method);
    if (status !== "ALL") params.set("status", status === "2xx" ? "200" : status === "4xx" ? "400" : "500");
    try {
      const res = await fetch(`${API_BASE}/api/logs?${params}`);
      const data = await res.json();
      setLogs(data.data ?? []);
      setTotal(data.pagination?.total ?? 0);
      setSelectedLog(data.data?.[0] ?? null);
    } catch {}
  }, []);

  useEffect(() => {
    if (!paused) {
      fetchLogs(methodFilter, statusFilter);
      const interval = setInterval(() => fetchLogs(methodFilter, statusFilter), 30000);
      return () => clearInterval(interval);
    }
  }, [paused, methodFilter, statusFilter, fetchLogs]);

  const handleMethodFilter = (m: string) => {
    setMethodFilter(m);
    fetchLogs(m, statusFilter);
  };

  const handleStatusFilter = (s: string) => {
    setStatusFilter(s);
    fetchLogs(methodFilter, s);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const curlCommand = selectedLog
    ? `curl -X ${selectedLog.method} ${API_BASE}${selectedLog.endpoint}`
    : "";

  const maxBar = Math.max(...barHeights, 1);

  return (
    <>
      {/* Hero Header */}
      <section className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-on-surface mb-2">Logs &amp; Monitoring</h2>
          <p className="text-secondary-fixed text-lg font-medium opacity-80">Real-time inspection of API transactions and system health.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-5 py-2.5 rounded-md bg-surface-container-high border border-outline-variant/20 text-on-surface font-semibold text-sm flex items-center gap-2 hover:bg-surface-container-highest transition-all"
          >
            <span className="material-symbols-outlined text-sm">download</span> Export JSON
          </button>
          <button
            onClick={() => setPaused((p) => !p)}
            className={`px-5 py-2.5 rounded-md font-bold text-sm flex items-center gap-2 transition-all ${
              paused
                ? "bg-surface-container-high border border-outline-variant/20 text-on-surface"
                : "bg-linear-to-br from-primary to-primary-container text-on-primary shadow-lg shadow-primary/10 hover:scale-[1.02]"
            }`}
          >
            <span className="material-symbols-outlined text-sm">{paused ? "play_arrow" : "pause"}</span>
            {paused ? "Resume" : "Pause Stream"}
          </button>
        </div>
      </section>

      {/* Metrics Bento */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Chart */}
        <div className="col-span-8 bg-surface-container-low rounded-xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-secondary-fixed font-headline font-semibold">Request Latency</h3>
              <p className="text-xs text-on-surface-variant">Last 60 minutes &bull; {barHeights.length} data points</p>
            </div>
            <div className="flex items-center gap-3">
              {paused && (
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest bg-orange-400/10 px-2 py-1 rounded-full">Paused</span>
              )}
              <button
                onClick={() => setChartType((t) => (t === "bar" ? "candlestick" : "bar"))}
                title={chartType === "bar" ? "Switch to Candlestick" : "Switch to Bar"}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                  chartType === "candlestick"
                    ? "border-primary text-primary bg-primary/10"
                    : "border-outline-variant/20 text-slate-500 hover:text-slate-300 hover:border-outline-variant/40"
                }`}
              >
                <span className="material-symbols-outlined text-sm">candlestick_chart</span>
                {chartType === "bar" ? "Candlestick" : "Bar Chart"}
              </button>
              <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1 rounded-full">
                <span className={`w-2 h-2 rounded-full ${paused ? "bg-orange-400" : "bg-tertiary animate-pulse shadow-[0_0_8px_#00e475]"}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${paused ? "text-orange-400" : "text-tertiary"}`}>
                  {paused ? "Paused" : "Live"}
                </span>
              </div>
            </div>
          </div>

          {chartType === "bar" ? (
            <div className="h-40 flex items-end gap-1">
              {barHeights.map((h, i) => (
                <div
                  key={i}
                  className={`w-full rounded-t-sm hover:bg-primary transition-colors cursor-pointer ${
                    i === barHeights.length - 1 ? "bg-primary" : i >= barHeights.length - 3 ? "bg-primary/30" : "bg-primary/10"
                  }`}
                  style={{ height: `${Math.max((h / maxBar) * 100, 3)}%` }}
                  title={`${h}ms`}
                />
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-end gap-1">
              {candles.map((c, i) => {
                const norm = (v: number) => Math.max((v / maxBar) * 100, 2);
                const bullish = c.close >= c.open;
                const bodyTop = Math.max(c.open, c.close);
                const bodyBot = Math.min(c.open, c.close);
                return (
                  <div key={i} className="relative flex-1 flex flex-col items-center" style={{ height: "100%" }}>
                    {/* Wick */}
                    <div
                      className={`absolute w-px ${bullish ? "bg-tertiary" : "bg-error"}`}
                      style={{
                        bottom: `${norm(c.low)}%`,
                        height: `${norm(c.high) - norm(c.low)}%`,
                        left: "50%",
                        transform: "translateX(-50%)",
                      }}
                    />
                    {/* Body */}
                    <div
                      className={`absolute w-full rounded-sm ${bullish ? "bg-tertiary/80" : "bg-error/80"}`}
                      style={{
                        bottom: `${norm(bodyBot)}%`,
                        height: `${Math.max(norm(bodyTop) - norm(bodyBot), 2)}%`,
                      }}
                      title={`O:${c.open.toFixed(0)} H:${c.high.toFixed(0)} L:${c.low.toFixed(0)} C:${c.close.toFixed(0)}ms`}
                    />
                  </div>
                );
              })}
            </div>
          )}
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
        <div className="flex-1 flex items-center gap-3 flex-wrap">
          <div className="bg-surface-container-high rounded-sm px-3 py-2 flex items-center gap-2 border border-outline-variant/20">
            <span className="material-symbols-outlined text-lg text-slate-400">calendar_today</span>
            <span className="text-sm font-medium">Last 24 hours</span>
          </div>
          <div className="h-6 w-px bg-outline-variant/20" />
          {/* Method filter */}
          <div className="flex items-center gap-1">
            {["ALL", "GET", "POST", "PATCH", "DELETE"].map((m) => (
              <button
                key={m}
                onClick={() => handleMethodFilter(m)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border transition-colors ${
                  methodFilter === m
                    ? "bg-primary text-on-primary border-primary"
                    : "border-outline-variant/20 text-on-surface hover:bg-surface-container-highest"
                }`}
              >
                {m === "ALL" ? "Method: ALL" : m}
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-outline-variant/20" />
          {/* Status filter */}
          <div className="flex items-center gap-1">
            {["ALL", "2xx", "4xx", "5xx"].map((s) => (
              <button
                key={s}
                onClick={() => handleStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-on-primary border-primary"
                    : "border-outline-variant/20 text-on-surface hover:bg-surface-container-highest"
                }`}
              >
                {s === "ALL" ? "Status: ALL" : s}
              </button>
            ))}
          </div>
          <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold uppercase tracking-tighter border border-outline-variant/20 text-on-surface ml-auto">
            {total} total
          </span>
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
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No log entries match your filters.</td></tr>
              )}
              {logs.map((log) => {
                const isError = log.statusCode >= 400;
                const isSlow = log.latencyMs > 1000;
                const isSelected = selectedLog?.id === log.id;
                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`hover:bg-surface-container-high group transition-all cursor-pointer border-y border-outline-variant/5 ${isSelected ? "bg-surface-container-high/50" : ""}`}
                  >
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
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                        className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors"
                      >
                        terminal
                      </button>
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
        {/* Critical Events */}
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

        {/* Payload Inspector */}
        <div className="col-span-12 md:col-span-8 bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-headline font-bold text-on-surface">Payload Inspector</h4>
            <span className="text-[10px] font-mono text-slate-500 bg-surface-container-high px-2 py-1 rounded-sm">
              REQUEST_ID: {selectedLog?.requestId || "—"}
            </span>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-4 font-mono text-xs text-on-secondary-container leading-relaxed overflow-x-auto h-32 no-scrollbar">
            <pre className="whitespace-pre">
              {selectedLog?.payload
                ? JSON.stringify(selectedLog.payload, null, 2)
                : "Click a log row to inspect its payload."}
            </pre>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <p className="text-[11px] text-slate-500 italic">
              {selectedLog
                ? `${selectedLog.method} ${selectedLog.endpoint} — ${selectedLog.statusText} (${selectedLog.latencyMs}ms)`
                : "Waiting for selection..."}
            </p>
            <button
              onClick={async () => {
                if (!curlCommand) return;
                await navigator.clipboard.writeText(curlCommand);
              }}
              className="text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary/10 px-3 py-1 rounded-sm transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
              Copy as Curl
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
