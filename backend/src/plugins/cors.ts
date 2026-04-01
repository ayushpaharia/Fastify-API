import type { FastifyInstance } from "fastify";
import cors from "@fastify/cors";

export async function registerCors(app: FastifyInstance) {
  const extraOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : [];

  await app.register(cors, {
    origin: ["http://localhost:3000", "http://localhost:3001", ...extraOrigins],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });
}
