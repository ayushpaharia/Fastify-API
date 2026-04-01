import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { endpoints, logs } from "../schema.js";
import { sql, avg, count, gte, eq } from "drizzle-orm";

export async function endpointRoutes(app: FastifyInstance) {
  app.get("/api/endpoints", async () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Get all endpoints
    const allEndpoints = await db.select().from(endpoints);

    // Get live stats per endpoint from logs (last hour)
    const liveStats = await db
      .select({
        endpoint: logs.endpoint,
        avgLatency: avg(logs.latencyMs),
        requestCount: count(),
      })
      .from(logs)
      .where(gte(logs.timestamp, oneHourAgo))
      .groupBy(logs.endpoint);

    const statsMap = new Map(liveStats.map((s) => [s.endpoint, s]));

    // Merge live stats into endpoints
    return allEndpoints.map((ep) => {
      const live = statsMap.get(ep.path);
      return {
        ...ep,
        latencyMs: live ? Math.round(Number(live.avgLatency)) : ep.latencyMs,
        reqPerMin: live ? Math.round(live.requestCount / 60) : ep.reqPerMin,
        liveTraffic: !!live,
      };
    });
  });

  app.post("/api/endpoints", async (req, reply) => {
    const body = req.body as {
      method: string;
      path: string;
      description?: string;
      category?: string;
    };
    const [created] = await db
      .insert(endpoints)
      .values({
        method: body.method,
        path: body.path,
        description: body.description,
        category: body.category,
      })
      .returning();
    return reply.status(201).send(created);
  });
}
