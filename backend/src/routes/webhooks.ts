import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { webhooks } from "../schema.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function webhookRoutes(app: FastifyInstance) {
  // List all webhooks
  app.get("/api/webhooks", async () => {
    return db.select().from(webhooks);
  });

  // Create webhook
  app.post("/api/webhooks", async (req, reply) => {
    const body = req.body as {
      name: string;
      url: string;
      events?: string[];
      secret?: string;
    };
    const secret = body.secret || crypto.randomBytes(32).toString("hex");
    const [created] = await db
      .insert(webhooks)
      .values({
        name: body.name,
        url: body.url,
        secret,
        events: body.events || ["log.error", "log.slow", "health.degraded"],
      })
      .returning();
    return reply.status(201).send(created);
  });

  // Update webhook
  app.patch("/api/webhooks/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<{
      name: string;
      url: string;
      events: string[];
      active: boolean;
    }>;
    const [updated] = await db
      .update(webhooks)
      .set(body)
      .where(eq(webhooks.id, parseInt(id)))
      .returning();
    if (!updated) return reply.status(404).send({ error: "Webhook not found" });
    return updated;
  });

  // Delete webhook
  app.delete("/api/webhooks/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const [deleted] = await db
      .delete(webhooks)
      .where(eq(webhooks.id, parseInt(id)))
      .returning();
    if (!deleted) return reply.status(404).send({ error: "Webhook not found" });
    return { deleted: true, id: deleted.id };
  });

  // Test webhook (sends a test payload)
  app.post("/api/webhooks/:id/test", async (req, reply) => {
    const { id } = req.params as { id: string };
    const [webhook] = await db.select().from(webhooks).where(eq(webhooks.id, parseInt(id)));
    if (!webhook) return reply.status(404).send({ error: "Webhook not found" });

    const testPayload = {
      event: "test",
      timestamp: new Date().toISOString(),
      data: { message: "Test webhook delivery from Fastify-API Technical Curator" },
    };

    try {
      const signature = crypto
        .createHmac("sha256", webhook.secret || "")
        .update(JSON.stringify(testPayload))
        .digest("hex");

      const res = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": "test",
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000),
      });

      await db
        .update(webhooks)
        .set({ lastTriggered: new Date(), lastStatus: res.status })
        .where(eq(webhooks.id, parseInt(id)));

      return { success: res.ok, status: res.status };
    } catch (err) {
      await db
        .update(webhooks)
        .set({ lastTriggered: new Date(), lastStatus: 0 })
        .where(eq(webhooks.id, parseInt(id)));
      return reply.status(502).send({ success: false, error: "Delivery failed" });
    }
  });
}

// Helper: fire webhooks for matching events (called from other routes)
export async function fireWebhooks(event: string, data: Record<string, unknown>) {
  const activeWebhooks = await db.select().from(webhooks).where(eq(webhooks.active, true));

  for (const wh of activeWebhooks) {
    const events = (wh.events as string[]) || [];
    if (!events.includes(event) && !events.includes("*")) continue;

    const payload = { event, timestamp: new Date().toISOString(), data };
    const signature = crypto
      .createHmac("sha256", wh.secret || "")
      .update(JSON.stringify(payload))
      .digest("hex");

    try {
      const res = await fetch(wh.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": event,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      await db.update(webhooks).set({ lastTriggered: new Date(), lastStatus: res.status }).where(eq(webhooks.id, wh.id));
    } catch {
      await db.update(webhooks).set({ lastTriggered: new Date(), lastStatus: 0 }).where(eq(webhooks.id, wh.id));
    }
  }
}
