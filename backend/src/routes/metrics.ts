import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { logs, endpoints, users } from "../schema.js";
import { sql, count, avg, eq, gte, and, lt } from "drizzle-orm";

export async function metricsRoutes(app: FastifyInstance) {
  // Live computed metrics from actual data
  app.get("/api/metrics", async (req) => {
    const url = new URL(req.url, `http://${req.hostname}`);
    const category = url.searchParams.get("category");

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    if (category === "dashboard" || !category) {
      // Total requests (all time)
      const [totalResult] = await db.select({ count: count() }).from(logs);
      const totalRequests = totalResult.count;

      // Total requests last 24h
      const [last24h] = await db
        .select({ count: count() })
        .from(logs)
        .where(gte(logs.timestamp, oneDayAgo));
      const requests24h = last24h.count;

      // Total requests previous 24h (for change calc)
      const [prev24h] = await db
        .select({ count: count() })
        .from(logs)
        .where(and(gte(logs.timestamp, twoDaysAgo), lt(logs.timestamp, oneDayAgo)));
      const requestsChange = prev24h.count > 0
        ? (((requests24h - prev24h.count) / prev24h.count) * 100).toFixed(1)
        : "0";

      // Avg latency
      const [latencyResult] = await db
        .select({ avg: avg(logs.latencyMs) })
        .from(logs)
        .where(gte(logs.timestamp, oneDayAgo));
      const avgLatency = Math.round(Number(latencyResult.avg) || 0);

      // Error rate (4xx + 5xx)
      const [errorResult] = await db
        .select({ count: count() })
        .from(logs)
        .where(and(gte(logs.timestamp, oneDayAgo), gte(logs.statusCode, 400)));
      const errorRate = requests24h > 0
        ? ((errorResult.count / requests24h) * 100).toFixed(2)
        : "0.00";

      const formatCount = (n: number): string => {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
        return String(n);
      };

      const dashboardMetrics = [
        {
          id: 1, name: "Total Requests", value: formatCount(totalRequests),
          change: `${Number(requestsChange) >= 0 ? "+" : ""}${requestsChange}%`,
          changeDirection: Number(requestsChange) >= 0 ? "up" : "down",
          category: "dashboard",
        },
        {
          id: 2, name: "Avg Latency", value: `${avgLatency}ms`,
          change: `${avgLatency}ms avg`,
          changeDirection: "down",
          category: "dashboard",
        },
        {
          id: 3, name: "Error Rate", value: `${errorRate}%`,
          change: `${errorResult.count} errors`,
          changeDirection: Number(errorRate) > 1 ? "up" : "down",
          category: "dashboard",
        },
      ];

      if (category === "dashboard") return dashboardMetrics;

      // Status code distribution
      const statusCodes = await db
        .select({
          bucket: sql<string>`CASE WHEN ${logs.statusCode} >= 200 AND ${logs.statusCode} < 300 THEN '2xx' WHEN ${logs.statusCode} >= 400 AND ${logs.statusCode} < 500 THEN '4xx' ELSE '5xx' END`,
          count: count(),
        })
        .from(logs)
        .where(gte(logs.timestamp, oneDayAgo))
        .groupBy(sql`CASE WHEN ${logs.statusCode} >= 200 AND ${logs.statusCode} < 300 THEN '2xx' WHEN ${logs.statusCode} >= 400 AND ${logs.statusCode} < 500 THEN '4xx' ELSE '5xx' END`);

      const statusMap: Record<string, number> = { "2xx": 0, "4xx": 0, "5xx": 0 };
      for (const s of statusCodes) statusMap[s.bucket] = s.count;
      const statusTotal = Object.values(statusMap).reduce((a, b) => a + b, 0) || 1;

      const statusMetrics = [
        { id: 4, name: "2xx Success", value: `${((statusMap["2xx"] / statusTotal) * 100).toFixed(1)}%`, change: null, changeDirection: "up", category: "status_codes" },
        { id: 5, name: "4xx Client Error", value: `${((statusMap["4xx"] / statusTotal) * 100).toFixed(1)}%`, change: null, changeDirection: "up", category: "status_codes" },
        { id: 6, name: "5xx Server Error", value: `${((statusMap["5xx"] / statusTotal) * 100).toFixed(1)}%`, change: null, changeDirection: "up", category: "status_codes" },
      ];

      // Instance health (real process stats)
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const cpuPct = Math.min(99, Math.round((cpuUsage.user + cpuUsage.system) / 1000000 / process.uptime() * 100));
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

      const instanceMetrics = [
        { id: 7, name: "CPU Usage", value: `${cpuPct}%`, change: null, changeDirection: "up", category: "instance" },
        { id: 8, name: "Memory Heap", value: `${heapUsedMB}MB / ${heapTotalMB}MB`, change: null, changeDirection: "up", category: "instance" },
      ];

      // User stats
      const [userCount] = await db.select({ count: count() }).from(users);
      const [activeUsers] = await db.select({ count: count() }).from(users).where(eq(users.status, "active"));
      const [endpointCount] = await db.select({ count: count() }).from(endpoints);

      const userMetrics = [
        { id: 9, name: "Total Users", value: String(userCount.count), change: `${activeUsers.count} active`, changeDirection: "up", category: "users" },
        { id: 10, name: "Active Now", value: String(activeUsers.count), change: `${Math.round((activeUsers.count / (userCount.count || 1)) * 100)}% engagement`, changeDirection: "up", category: "users" },
        { id: 11, name: "API Requests", value: formatCount(totalRequests), change: `${endpointCount.count} endpoints`, changeDirection: "up", category: "users" },
        { id: 12, name: "Revoked Keys", value: "0", change: "0 flagged", changeDirection: "up", category: "users" },
      ];

      // Logs page stats
      const logsMetrics = [
        { id: 13, name: "Total Requests 24h", value: formatCount(requests24h), change: `${Number(requestsChange) >= 0 ? "+" : ""}${requestsChange}%`, changeDirection: Number(requestsChange) >= 0 ? "up" : "down", category: "logs" },
        { id: 14, name: "Error Rate 24h", value: `${errorRate}%`, change: `${errorResult.count} errors`, changeDirection: Number(errorRate) > 1 ? "up" : "down", category: "logs" },
      ];

      return [...dashboardMetrics, ...statusMetrics, ...instanceMetrics, ...userMetrics, ...logsMetrics];
    }

    // Filter by specific category
    const allMetrics = await app.inject({ method: "GET", url: "/api/metrics" });
    const all = JSON.parse(allMetrics.body) as { category: string }[];
    return all.filter((m) => m.category === category);
  });
}
