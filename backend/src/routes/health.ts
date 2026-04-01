import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { logs, endpoints, users } from "../schema.js";
import { sql, count, gte, and } from "drizzle-orm";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/api/health", async () => {
    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Real DB ping
    let dbStatus = "operational";
    let dbLatencyMs = 0;
    try {
      const start = performance.now();
      await db.execute(sql`SELECT 1`);
      dbLatencyMs = Math.round(performance.now() - start);
    } catch {
      dbStatus = "degraded";
    }

    // Recent error rate (last 5 min)
    const [recentTotal] = await db.select({ count: count() }).from(logs).where(gte(logs.timestamp, fiveMinAgo));
    const [recentErrors] = await db.select({ count: count() }).from(logs).where(and(gte(logs.timestamp, fiveMinAgo), gte(logs.statusCode, 400)));
    const recentErrorRate = recentTotal.count > 0 ? (recentErrors.count / recentTotal.count) : 0;

    // Active endpoints count
    const [epCount] = await db.select({ count: count() }).from(endpoints);
    const [userCount] = await db.select({ count: count() }).from(users);

    const overallStatus = dbStatus === "operational" && recentErrorRate < 0.1 ? "operational" : "degraded";

    return {
      status: overallStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: "2.4.0",
      cluster: "aws-us-east-1",
      database: { status: dbStatus, latencyMs: dbLatencyMs },
      services: {
        api: overallStatus,
        database: dbStatus,
        auth: "operational",
      },
      stats: {
        endpoints: epCount.count,
        users: userCount.count,
        recentRequests: recentTotal.count,
        recentErrorRate: `${(recentErrorRate * 100).toFixed(2)}%`,
      },
    };
  });
}
