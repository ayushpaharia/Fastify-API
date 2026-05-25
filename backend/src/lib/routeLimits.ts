/**
 * Shared per-route rate-limit configs for @fastify/rate-limit.
 *
 * Usage:
 *   app.get("/api/health",          { config: RL.none },   handler);
 *   app.post("/api/webhooks",       { config: RL.write },  handler);
 *   app.post("/api/ingest",         { config: RL.strict }, handler);
 *   app.get("/api/auth/me",         { preHandler: requireAuth, config: RL.read }, handler);
 *
 * Tiers (per key = userId || req.ip):
 *   none   → bypass         (uptime monitors)
 *   read   → default global (15 / min — explicit when you want it documented)
 *   write  → 5 / min        (POST/PATCH/DELETE/PUT)
 *   strict → 2 / min        (expensive: bulk insert, outbound fetch)
 */
export const RL = {
  none: { rateLimit: false },
  read: { rateLimit: { max: 15, timeWindow: "1 minute" } },
  write: { rateLimit: { max: 5, timeWindow: "1 minute" } },
  strict: { rateLimit: { max: 2, timeWindow: "1 minute" } },
} as const;
