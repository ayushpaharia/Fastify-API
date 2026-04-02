import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { users, sessions } from "../schema.js";
import { eq, sql, desc } from "drizzle-orm";

const ROLE_RANK: Record<string, number> = {
  admin: 3,
  developer: 2,
  viewer: 1,
};

const AUTH_RANK: Record<string, number> = {
  "Full System Write": 3,
  "Read/Write API": 2,
  "Read-only Analytics": 1,
};

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

// For this demo, user ID 1 is always "self" (Ayush Paharia)
const SELF_USER_ID = 1;

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
    const userId = parseInt(id);
    const body = req.body as Partial<{
      name: string;
      role: string;
      authLevel: string;
      status: string;
    }>;

    // Look up current user to enforce self-protection
    const [current] = await db.select().from(users).where(eq(users.id, userId));
    if (!current) return reply.status(404).send({ error: "User not found" });

    const isSelf = userId === SELF_USER_ID;

    // Cannot downgrade own role
    if (isSelf && body.role && (ROLE_RANK[body.role] ?? 0) < (ROLE_RANK[current.role] ?? 0)) {
      return reply.status(403).send({ error: "Cannot reduce your own role" });
    }

    // Cannot downgrade own auth level
    if (isSelf && body.authLevel && (AUTH_RANK[body.authLevel] ?? 0) < (AUTH_RANK[current.authLevel] ?? 0)) {
      return reply.status(403).send({ error: "Cannot reduce your own authorization level" });
    }

    // Cannot deactivate self
    if (isSelf && body.status === "inactive") {
      return reply.status(403).send({ error: "Cannot deactivate your own account" });
    }

    const [updated] = await db
      .update(users)
      .set(body)
      .where(eq(users.id, userId))
      .returning();
    return updated;
  });

  app.delete("/api/users/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = parseInt(id);

    // Cannot delete self
    if (userId === SELF_USER_ID) {
      return reply.status(403).send({ error: "Cannot delete your own account" });
    }

    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();
    if (!deleted) return reply.status(404).send({ error: "User not found" });
    return { success: true, deleted };
  });
}
