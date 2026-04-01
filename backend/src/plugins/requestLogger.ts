import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { logs } from "../schema.js";
import crypto from "crypto";

export async function registerRequestLogger(app: FastifyInstance) {
  app.addHook("onResponse", async (req, reply) => {
    // Skip logging for the logs endpoint itself to avoid recursion
    if (req.url.startsWith("/api/logs") || req.url.startsWith("/api/metrics")) return;
    // Skip health checks from being logged too frequently
    if (req.url === "/api/health" && Math.random() > 0.1) return;

    const method = req.method;
    const endpoint = req.url.split("?")[0]; // strip query params
    const statusCode = reply.statusCode;
    const latencyMs = Math.round(reply.elapsedTime);
    const requestId = (req.headers["x-request-id"] as string) || crypto.randomUUID().slice(0, 12);

    const statusTexts: Record<number, string> = {
      200: "200 OK",
      201: "201 Created",
      204: "204 No Content",
      304: "304 Not Modified",
      400: "400 Bad Request",
      401: "401 Unauthorized",
      403: "403 Forbidden",
      404: "404 Not Found",
      429: "429 Too Many Requests",
      500: "500 Internal Server Error",
    };

    try {
      await db.insert(logs).values({
        method,
        endpoint,
        statusCode,
        statusText: statusTexts[statusCode] || `${statusCode}`,
        latencyMs,
        requestId,
        payload: {
          header: {
            "user-agent": req.headers["user-agent"] || "unknown",
            "content-type": req.headers["content-type"] || "",
            "x-request-id": requestId,
          },
          userId: req.userId || null,
        },
      });
    } catch {
      // Don't let logging failures break the API
    }
  });
}
