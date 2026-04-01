import { db } from "./db.js";
import { users, endpoints, logs } from "./schema.js";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Clear existing data (metrics table no longer seeded — computed live)
  await db.execute(sql`TRUNCATE users, endpoints, logs, metrics RESTART IDENTITY CASCADE`);

  // Users — real team members
  await db.insert(users).values([
    {
      name: "Alex Sokolov",
      email: "alex.s@fastify.io",
      role: "admin",
      authLevel: "Full System Write",
      status: "active",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuARoPLuzkjaSPEIZQQTaJUM6IBd14OW5qPgcLj1NBJdoBbPgPyzCvOvYf6fVYQWUx5XXEsH5KklR4z3JAPc6vQplSiV6YNocNfYQ0t4zDHA-iOlNG2uVup4-8zgXR9pIyblt3JtoJoX8a7czqhoKKTGMb2QKIN4B-_jAzUXKGFOqft4Re40uSmmaScAR8WcOMTwUFFx4KQGJIbLpj4CjkkbCJaW3dokQXZZTtVIbFbUV_mgdKZUEY1JHqE0sWczz6Pwl0MhHere7Q",
      lastActivity: "Just now",
    },
    {
      name: "Maria Chen",
      email: "m.chen@devops.co",
      role: "developer",
      authLevel: "Read/Write API",
      status: "active",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAm7bHfAETxPfbYxeXwZ9xv35LQ0yEsbQ0aqYG3aoziKTGnOPAqngDH8teJuTFhMpSMfDEnXteZh3oWp0N-2txL-mD17VdSn7GM3gU5WDJBpzGewdqJ8EkzKFITeROGZ6qc8K2V743tJuKJ2s59I2UZqK4cDaiPsxWdGmGyc58w4othuZpcTRCmctgdQuS6E3PVGvd0-uJCMqn-R4c6CFyAUE65f-M_ttKFKIyDHagX6g7Cvq0R7ZQ397w17ELM5rCL5hyxyKPCXQ",
      lastActivity: "1 hour ago",
    },
    {
      name: "Jordan Klein",
      email: "j.klein@archive.io",
      role: "viewer",
      authLevel: "Read-only Analytics",
      status: "inactive",
      avatarUrl: null,
      lastActivity: "12 days ago",
    },
    {
      name: "Takahiro Hiroshi",
      email: "hiroshi@global-tek.jp",
      role: "developer",
      authLevel: "Read/Write API",
      status: "active",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBG9ndJaQs-i6JASyGFV8_-qXCmW7-GYnBLr3vabae9NEpefOccMvB5q_Cpe8zfKA5YakLMZoUMmQxhkAUZlmbQtfm5ijslh0z_tabeffOu73h32Z6o8-jkFt7WTE8g5sH_xT1xkZqn71tJDPSVTJsQ-39e6qgXbmVpW6wxt4qcOq-GhAJ_SSXW4z1BXHJrbvxwkOvniTCO7MawUcz89Bc9SIjkPcezWC9grFKjRxkdC0tZaF6UA5sA6ZwlwY3iynON2-we_R4bYg",
      lastActivity: "Just now",
    },
  ]);

  // Endpoints — registered API routes
  await db.insert(endpoints).values([
    { method: "GET", path: "/v1/auth/session/refresh", description: "Refresh user authentication session token", category: "Authentication Layer", latencyMs: 12, reqPerMin: 432, uptimePct: 98, status: "active" },
    { method: "POST", path: "/v2/analytics/stream/events", description: "Stream analytics events for real-time processing", category: "Data Ingestion", latencyMs: 156, reqPerMin: 1200, uptimePct: 82, status: "active" },
    { method: "PATCH", path: "/users/{user_id}/metadata", description: "Update user metadata fields", category: "User Service", latencyMs: 34, reqPerMin: 89, uptimePct: 95, status: "active" },
    { method: "GET", path: "/v1/analytics/usage", description: "Retrieves aggregated usage metrics for the specified API key.", category: "Analytics", latencyMs: 18, reqPerMin: 520, uptimePct: 99.99, status: "active" },
    { method: "POST", path: "/endpoints/register", description: "Register a new downstream microservice to the Curator proxy.", category: "Registration", latencyMs: 45, reqPerMin: 12, uptimePct: 100, status: "active" },
    { method: "GET", path: "/v1/health", description: "Health check endpoint", category: "System", latencyMs: 4, reqPerMin: 600, uptimePct: 100, status: "active" },
    { method: "GET", path: "/v1/health/db", description: "Internal database connection pool status", category: "System", latencyMs: 8, reqPerMin: 120, uptimePct: 100, status: "active" },
  ]);

  // No static logs or metrics — they're now generated from real API traffic
  console.log("Seed complete! Metrics and logs are now computed from live API traffic.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
