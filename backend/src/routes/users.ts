import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { users } from "../schema.js";
import { eq, ilike, sql } from "drizzle-orm";

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
