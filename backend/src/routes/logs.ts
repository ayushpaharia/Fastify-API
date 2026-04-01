import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { logs } from "../schema.js";
import { eq, gte, sql, desc } from "drizzle-orm";

export async function logRoutes(app: FastifyInstance) {
  app.get("/api/logs", async (req) => {
    const url = new URL(req.url, `http://${req.hostname}`);
    const method = url.searchParams.get("method");
    const minLatency = url.searchParams.get("minLatency");
    const statusFilter = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (method) conditions.push(eq(logs.method, method.toUpperCase()));
    if (minLatency) conditions.push(gte(logs.latencyMs, parseInt(minLatency)));
    if (statusFilter) {
      if (statusFilter === "4xx") conditions.push(sql`${logs.statusCode} >= 400 AND ${logs.statusCode} < 500`);
      else if (statusFilter === "5xx") conditions.push(sql`${logs.statusCode} >= 500`);
      else if (statusFilter === "2xx") conditions.push(sql`${logs.statusCode} >= 200 AND ${logs.statusCode} < 300`);
    }

    const where = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

    const data = await db.select().from(logs).where(where).orderBy(desc(logs.timestamp)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(logs).where(where);

    return {
      data,
      pagination: {
        page,
        limit,
        total: Number(count),
        pages: Math.ceil(Number(count) / limit),
      },
    };
  });
}
