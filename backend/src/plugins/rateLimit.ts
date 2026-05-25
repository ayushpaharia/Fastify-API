import type { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";

/**
 * Global rate limit. Per-route overrides live next to each route definition
 * via `{ config: RL.* }` from src/lib/routeLimits.ts — that pattern is the only
 * one @fastify/rate-limit honours reliably (an onRoute hook here runs AFTER
 * the plugin has already wired up the route, so its overrides are ignored).
 *
 * Defaults (per key = userId || req.ip):
 *   - 15 req / min
 *   - 3 consecutive 429s → 403 ban (in-memory; clears on restart or LRU evict)
 *   - cache capped at 10k keys
 */
export async function registerRateLimit(app: FastifyInstance) {
  await app.register(rateLimit, {
    global: true,
    max: 15,
    timeWindow: "1 minute",
    ban: 3,
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
}
