import type { FastifyInstance } from "fastify";
import { requireAuth } from "../plugins/auth.js";
import { db } from "../db.js";
import { users } from "../schema.js";
import { eq } from "drizzle-orm";

export async function authRoutes(app: FastifyInstance) {
  // Get current user profile (requires auth)
  app.get("/api/auth/me", { preHandler: requireAuth }, async (req) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, req.userId!));

    if (!user) {
      return { authenticated: true, userId: req.userId, profile: null };
    }
    return { authenticated: true, userId: req.userId, profile: user };
  });

  // Sync Clerk user to local DB (called after sign-up/sign-in)
  app.post("/api/auth/sync", { preHandler: requireAuth }, async (req) => {
    const { name, email, avatarUrl } = req.body as {
      name: string;
      email: string;
      avatarUrl?: string;
    };

    // Upsert: create or update the user record
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, req.userId!));

    if (existing.length > 0) {
      const [updated] = await db
        .update(users)
        .set({ name, email, avatarUrl, lastActivity: "Just now" })
        .where(eq(users.clerkId, req.userId!))
        .returning();
      return { synced: true, user: updated };
    }

    const [created] = await db
      .insert(users)
      .values({
        clerkId: req.userId!,
        name,
        email,
        avatarUrl,
        role: "viewer",
        authLevel: "Read-only Analytics",
        status: "active",
        lastActivity: "Just now",
      })
      .returning();

    return { synced: true, user: created };
  });

  // Public check endpoint
  app.get("/api/auth/status", async (req) => ({
    authenticated: !!req.userId,
    userId: req.userId || null,
  }));
}
