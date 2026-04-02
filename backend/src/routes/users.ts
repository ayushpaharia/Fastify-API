import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { users, sessions } from "../schema.js";
import { eq, sql, desc } from "drizzle-orm";

function timeAgo(date: Date | null): string {
  if (!date) return "Never";
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export async function userRoutes(app: FastifyInstance) {
  app.get("/api/users", async (req) => {
    const url = new URL(req.url, `http://${req.hostname}`);
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (role) conditions.push(eq(users.role, role));
    if (status) conditions.push(eq(users.status, status));

    const where = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

    const data = await db.select().from(users).where(where).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(users).where(where);

    // Compute lastActivity from sessions for each user
    const enriched = await Promise.all(
      data.map(async (user) => {
        const [latestSession] = await db
          .select({ lastActiveAt: sessions.lastActiveAt })
          .from(sessions)
          .where(eq(sessions.userId, user.id))
          .orderBy(desc(sessions.lastActiveAt))
          .limit(1);

        return {
          ...user,
          lastActivity: timeAgo(latestSession?.lastActiveAt ?? null),
        };
      })
    );

    return {
      data: enriched,
      pagination: {
        page,
        limit,
        total: Number(count),
        pages: Math.ceil(Number(count) / limit),
      },
    };
  });

  // Sessions endpoints
  app.get("/api/sessions", async (req) => {
    const url = new URL(req.url, `http://${req.hostname}`);
    const userId = url.searchParams.get("userId");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const where = userId ? eq(sessions.userId, parseInt(userId)) : undefined;

    const data = await db
      .select()
      .from(sessions)
      .where(where)
      .orderBy(desc(sessions.lastActiveAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(sessions)
      .where(where);

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

  app.post("/api/users", async (req, reply) => {
    const body = req.body as {
      name: string;
      email: string;
      role?: string;
      authLevel?: string;
    };
    const [created] = await db
      .insert(users)
      .values({
        name: body.name,
        email: body.email,
        role: body.role || "viewer",
        authLevel: body.authLevel || "Read-only Analytics",
      })
      .returning();
    return reply.status(201).send(created);
  });

  app.patch("/api/users/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<{
      name: string;
      role: string;
      authLevel: string;
      status: string;
    }>;
    const [updated] = await db
      .update(users)
      .set(body)
      .where(eq(users.id, parseInt(id)))
      .returning();
    if (!updated) return reply.status(404).send({ error: "User not found" });
    return updated;
  });
}
