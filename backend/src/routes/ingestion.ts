import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { ingestionLogs } from "../schema.js";
import { sql, desc, gte, eq, count } from "drizzle-orm";
import { fireWebhooks } from "./webhooks.js";

export async function ingestionRoutes(app: FastifyInstance) {
  // Ingest external logs (POST — external systems push here)
  app.post("/api/ingest", async (req, reply) => {
    const body = req.body as
      | { source: string; level?: string; message: string; metadata?: Record<string, unknown> }
      | Array<{ source: string; level?: string; message: string; metadata?: Record<string, unknown> }>;

    const entries = Array.isArray(body) ? body : [body];

    if (entries.length === 0) return reply.status(400).send({ error: "No log entries provided" });
    if (entries.length > 100) return reply.status(400).send({ error: "Max 100 entries per batch" });

    const inserted = await db
      .insert(ingestionLogs)
      .values(
        entries.map((e) => ({
          source: e.source,
          level: e.level || "info",
          message: e.message,
          metadata: e.metadata || null,
        }))
      )
      .returning();

    // Fire webhooks for error-level ingestion logs
    const errorEntries = entries.filter((e) => e.level === "error" || e.level === "fatal");
    if (errorEntries.length > 0) {
      fireWebhooks("ingestion.error", {
        count: errorEntries.length,
        source: errorEntries[0].source,
        sample: errorEntries[0].message,
      }).catch(() => {});
    }

    return reply.status(201).send({
      ingested: inserted.length,
      ids: inserted.map((i) => i.id),
    });
  });

  // Query ingestion logs
  app.get("/api/ingest", async (req) => {
    const url = new URL(req.url, `http://${req.hostname}`);
    const source = url.searchParams.get("source");
    const level = url.searchParams.get("level");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (source) conditions.push(eq(ingestionLogs.source, source));
    if (level) conditions.push(eq(ingestionLogs.level, level));

    const where = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

    const data = await db
      .select()
      .from(ingestionLogs)
      .where(where)
      .orderBy(desc(ingestionLogs.timestamp))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(ingestionLogs)
      .where(where);

    return {
      data,
      pagination: { page, limit, total: Number(total), pages: Math.ceil(Number(total) / limit) },
    };
  });

  // Ingestion stats
  app.get("/api/ingest/stats", async () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [totalResult] = await db.select({ count: count() }).from(ingestionLogs);
    const [recentResult] = await db.select({ count: count() }).from(ingestionLogs).where(gte(ingestionLogs.timestamp, oneHourAgo));

    const byLevel = await db
      .select({ level: ingestionLogs.level, count: count() })
      .from(ingestionLogs)
      .groupBy(ingestionLogs.level);

    const bySrc = await db
      .select({ source: ingestionLogs.source, count: count() })
      .from(ingestionLogs)
      .groupBy(ingestionLogs.source)
      .limit(10);

    return {
      total: totalResult.count,
      lastHour: recentResult.count,
      byLevel: Object.fromEntries(byLevel.map((b) => [b.level, b.count])),
      topSources: bySrc,
    };
  });
}
