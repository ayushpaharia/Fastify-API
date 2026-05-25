import type { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";

/**
 * Tight rate limiting designed to keep a single-node deployment from running up
 * Neon DB compute hours under organic-looking traffic or an abuser drip.
 *
 * Tiers (all per-key, keyed by authenticated userId else req.ip):
 *   - Default reads ............ 15 / min
 *   - Writes (POST/PATCH/DELETE)  5 / min
 *   - Ingestion + webhook test .. 2 / min   (the most expensive routes)
 *   - /api/health ............... unlimited (skipped — needed for monitors)
 *
 * Ban: after 3 consecutive 429s the key gets a 403 instead and is tracked in
 * the in-memory LRU. The ban persists until the process restarts or the LRU
 * evicts the key — fine for a single-instance VM.
 */

const STRICT_PATHS = new Set([
  "/api/ingest",
  "/api/webhooks/:id/test",
]);

export async function registerRateLimit(app: FastifyInstance) {
  await app.register(rateLimit, {
    global: true,
    max: 15,
    timeWindow: "1 minute",
    ban: 3,
    // Bound memory — at most 10k distinct keys tracked
    cache: 10_000,
    keyGenerator: (req) => req.userId || req.ip,
    skipOnError: false,
    errorResponseBuilder: (_req, context) => ({
      error: "Rate limit exceeded",
      message: `You have exceeded the ${context.max} requests/min limit. Please wait ${Math.ceil(context.ttl / 1000)}s.`,
      statusCode: context.ban ? 403 : 429,
      retryAfter: Math.ceil(context.ttl / 1000),
    }),
    addHeadersOnExceeding: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
    },
    addHeaders: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
      "retry-after": true,
    },
  });

  // Per-route overrides — applied at route-registration time
  app.addHook("onRoute", (routeOptions) => {
    const method = String(routeOptions.method || "").toUpperCase();
    const url = String(routeOptions.url || "");
    const existing = (routeOptions.config as Record<string, unknown>) || {};

    // Health checks: opt out so uptime monitors don't get banned
    if (url === "/api/health") {
      routeOptions.config = {
        ...existing,
        rateLimit: false,
      };
      return;
    }

    // Strictest tier — expensive endpoints
    if (STRICT_PATHS.has(url)) {
      routeOptions.config = {
        ...existing,
        rateLimit: { max: 2, timeWindow: "1 minute" },
      };
      return;
    }

    // Writes — 5/min
    if (method === "POST" || method === "PATCH" || method === "DELETE" || method === "PUT") {
      routeOptions.config = {
        ...existing,
        rateLimit: { max: 5, timeWindow: "1 minute" },
      };
    }
  });
}
