import type { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";

export async function registerRateLimit(app: FastifyInstance) {
  await app.register(rateLimit, {
    global: true,
    max: 30,            // 30 requests per window (heavy limit)
    timeWindow: "1 minute",
    ban: 5,             // After 5 rate-limit hits, return 403 instead of 429
    keyGenerator: (req) => {
      // Use authenticated user ID if available, otherwise IP
      return req.userId || req.ip;
    },
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

  // Stricter limit for write operations
  app.addHook("onRoute", (routeOptions) => {
    if (routeOptions.method === "POST" || routeOptions.method === "PATCH" || routeOptions.method === "DELETE") {
      const existingConfig = routeOptions.config as Record<string, unknown> || {};
      routeOptions.config = {
        ...existingConfig,
        rateLimit: {
          max: 10,             // Only 10 writes per minute
          timeWindow: "1 minute",
        },
      };
    }
  });
}
