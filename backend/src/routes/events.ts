import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { logs } from "../schema.js";
import { sql, desc, gte, or, and } from "drizzle-orm";

export async function eventRoutes(app: FastifyInstance) {
  // Critical events derived from real log data
  app.get("/api/events", async () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Find error logs (4xx/5xx)
    const errorLogs = await db
      .select()
      .from(logs)
      .where(and(gte(logs.timestamp, oneHourAgo), gte(logs.statusCode, 400)))
      .orderBy(desc(logs.timestamp))
      .limit(10);

    // Find slow requests (>500ms)
    const slowLogs = await db
      .select()
      .from(logs)
      .where(and(gte(logs.timestamp, oneHourAgo), gte(logs.latencyMs, 500)))
      .orderBy(desc(logs.timestamp))
      .limit(10);

    // Find recent successful operations (info events)
    const recentOps = await db
      .select()
      .from(logs)
      .where(gte(logs.timestamp, oneHourAgo))
      .orderBy(desc(logs.timestamp))
      .limit(5);

    const events: {
      type: "error" | "warning" | "info";
      title: string;
      message: string;
      timestamp: string;
      timeAgo: string;
    }[] = [];

    // Convert error logs to events
    for (const log of errorLogs) {
      events.push({
        type: "error",
        title: `${log.statusText}`,
        message: `${log.method} ${log.endpoint} returned ${log.statusCode} (${log.latencyMs}ms)`,
        timestamp: log.timestamp?.toISOString() || "",
        timeAgo: getTimeAgo(log.timestamp),
      });
    }

    // Convert slow requests to warnings
    for (const log of slowLogs) {
      if (!errorLogs.find((e) => e.id === log.id)) {
        events.push({
          type: "warning",
          title: "High Latency Alert",
          message: `${log.method} ${log.endpoint} took ${log.latencyMs}ms (p99 threshold exceeded)`,
          timestamp: log.timestamp?.toISOString() || "",
          timeAgo: getTimeAgo(log.timestamp),
        });
      }
    }

    // Add info events from recent operations
    if (recentOps.length > 0 && events.length < 5) {
      const latest = recentOps[0];
      events.push({
        type: "info",
        title: "System Activity",
        message: `${recentOps.length} requests processed in last hour. Latest: ${latest.method} ${latest.endpoint} (${latest.latencyMs}ms)`,
        timestamp: latest.timestamp?.toISOString() || "",
        timeAgo: getTimeAgo(latest.timestamp),
      });
    }

    // If no events at all, return system healthy event
    if (events.length === 0) {
      events.push({
        type: "info",
        title: "All Clear",
        message: "No errors or alerts in the last hour. All systems nominal.",
        timestamp: new Date().toISOString(),
        timeAgo: "now",
      });
    }

    // Sort by timestamp desc
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return events.slice(0, 10);
  });

  // Sparkline time-series data from real logs
  app.get("/api/metrics/sparkline", async () => {
    const now = new Date();
    const buckets = 12; // 12 buckets of 5 minutes = last hour

    const series: { requests: number[]; latency: number[]; errors: number[] } = {
      requests: [],
      latency: [],
      errors: [],
    };

    for (let i = buckets - 1; i >= 0; i--) {
      const bucketStart = new Date(now.getTime() - (i + 1) * 5 * 60 * 1000);
      const bucketEnd = new Date(now.getTime() - i * 5 * 60 * 1000);

      const [stats] = await db
        .select({
          count: sql<number>`count(*)`,
          avgLatency: sql<number>`coalesce(avg(${logs.latencyMs}), 0)`,
          errorCount: sql<number>`count(*) filter (where ${logs.statusCode} >= 400)`,
        })
        .from(logs)
        .where(sql`${logs.timestamp} >= ${bucketStart} AND ${logs.timestamp} < ${bucketEnd}`);

      series.requests.push(Number(stats.count));
      series.latency.push(Math.round(Number(stats.avgLatency)));
      series.errors.push(Number(stats.errorCount));
    }

    // Normalize to percentages for sparkline display
    const maxReq = Math.max(...series.requests, 1);
    const maxLat = Math.max(...series.latency, 1);
    const maxErr = Math.max(...series.errors, 1);

    return {
      requests: series.requests.map((v) => Math.round((v / maxReq) * 100)),
      latency: series.latency.map((v) => Math.round((v / maxLat) * 100)),
      errors: series.errors.map((v) => Math.round((v / maxErr) * 100)),
      raw: series,
    };
  });
}

function getTimeAgo(date: Date | null): string {
  if (!date) return "unknown";
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}
