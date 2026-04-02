import { db } from "./db.js";
import {
  users,
  endpoints,
  logs,
  metrics,
  webhooks,
  ingestionLogs,
  sessions,
} from "./schema.js";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function token(): string {
  return `sk_live_${uuid().replace(/-/g, "")}`;
}

// ---------------------------------------------------------------------------
// Data definitions
// ---------------------------------------------------------------------------

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0",
  "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "axios/1.6.0",
  "node-fetch/3.3.2",
  "PostmanRuntime/7.36",
  "curl/8.4.0",
  "Go-http-client/2.0",
  "python-requests/2.31.0",
] as const;

const ENDPOINTS_DATA = [
  { method: "GET", path: "/v1/auth/session/refresh", description: "Refresh user authentication session token", category: "Authentication Layer" },
  { method: "POST", path: "/v2/analytics/stream/events", description: "Stream analytics events for real-time processing", category: "Data Ingestion" },
  { method: "PATCH", path: "/users/{user_id}/metadata", description: "Update user metadata fields", category: "User Service" },
  { method: "GET", path: "/v1/analytics/usage", description: "Retrieves aggregated usage metrics for the specified API key", category: "Analytics" },
  { method: "POST", path: "/endpoints/register", description: "Register a new downstream microservice to the Curator proxy", category: "Registration" },
  { method: "GET", path: "/v1/health", description: "Health check endpoint", category: "System" },
  { method: "GET", path: "/v1/health/db", description: "Internal database connection pool status", category: "System" },
  { method: "POST", path: "/v1/auth/login", description: "Authenticate user and issue JWT", category: "Authentication Layer" },
  { method: "DELETE", path: "/users/{user_id}", description: "Soft-delete a user account", category: "User Service" },
  { method: "GET", path: "/v1/logs/export", description: "Export log data as CSV or JSON", category: "Observability" },
  { method: "POST", path: "/v1/webhooks/dispatch", description: "Manually dispatch a webhook event", category: "Webhooks" },
  { method: "GET", path: "/v1/billing/usage", description: "Retrieve current billing cycle usage", category: "Billing" },
] as const;

const STATUS_PROFILES = [
  { code: 200, text: "OK", weight: 60 },
  { code: 201, text: "Created", weight: 8 },
  { code: 204, text: "No Content", weight: 5 },
  { code: 304, text: "Not Modified", weight: 4 },
  { code: 400, text: "Bad Request", weight: 6 },
  { code: 401, text: "Unauthorized", weight: 3 },
  { code: 403, text: "Forbidden", weight: 2 },
  { code: 404, text: "Not Found", weight: 5 },
  { code: 422, text: "Unprocessable Entity", weight: 2 },
  { code: 429, text: "Too Many Requests", weight: 2 },
  { code: 500, text: "Internal Server Error", weight: 2 },
  { code: 502, text: "Bad Gateway", weight: 0.5 },
  { code: 503, text: "Service Unavailable", weight: 0.5 },
] as const;

const INGESTION_SOURCES = ["stripe-webhook", "github-events", "datadog-forwarder", "cloudwatch-bridge", "sentry-relay"] as const;
const INGESTION_LEVELS = ["info", "warn", "error", "fatal"] as const;

const INGESTION_MESSAGES: Record<string, string[]> = {
  info: [
    "Webhook payload processed successfully",
    "Event batch ingested: 24 records",
    "Heartbeat received from upstream",
    "Schema validation passed for incoming payload",
    "Pipeline flush completed — 0 records dropped",
  ],
  warn: [
    "Payload size exceeds soft limit (512KB), consider batching",
    "Duplicate event ID detected, skipping re-processing",
    "Source latency above 2s threshold",
    "Rate limit approaching: 85% of quota used",
    "Deprecated field 'v1_token' found in payload",
  ],
  error: [
    "Failed to parse incoming JSON — malformed body",
    "Connection refused by upstream: ECONNREFUSED 10.0.3.12:5432",
    "Authentication token expired for source integration",
    "Schema validation failed: missing required field 'event_type'",
    "Dead letter queue write failed — disk full",
  ],
  fatal: [
    "Ingestion pipeline halted — unrecoverable state",
    "Database connection pool exhausted, all retries failed",
  ],
};

// ---------------------------------------------------------------------------
// Weighted random status code picker
// ---------------------------------------------------------------------------

function pickStatus(): { code: number; text: string } {
  const totalWeight = STATUS_PROFILES.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const s of STATUS_PROFILES) {
    roll -= s.weight;
    if (roll <= 0) return { code: s.code, text: s.text };
  }
  return { code: 200, text: "OK" };
}

function pickLatency(statusCode: number, method: string): number {
  const base = method === "GET" ? randomInt(4, 80) : randomInt(20, 200);
  if (statusCode >= 500) return base + randomInt(200, 1500);
  if (statusCode === 429) return randomInt(2, 10);
  if (statusCode >= 400) return base + randomInt(10, 60);
  return base;
}

// ---------------------------------------------------------------------------
// Seed function
// ---------------------------------------------------------------------------

async function seed() {
  console.log("🌱 Seeding database...\n");

  // Clear all tables
  await db.execute(
    sql`TRUNCATE users, endpoints, logs, metrics, webhooks, ingestion_logs, sessions RESTART IDENTITY CASCADE`
  );
  console.log("  ✓ Truncated all tables");

  const now = Date.now();
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  // ── Users ────────────────────────────────────────────────────────────
  // lastActivity is no longer a static string — computed live from sessions
  const userRows = await db
    .insert(users)
    .values([
      {
        name: "Ayush Paharia",
        email: "ayush@fastify.io",
        role: "admin",
        authLevel: "Full System Write",
        status: "active",
        avatarUrl: null,
        lastActivity: "Just now",
      },
    ])
    .returning();
  console.log(`  ✓ Inserted ${userRows.length} users`);

  // ── Sessions ─────────────────────────────────────────────────────────
  // Each user gets multiple sessions across different time ranges
  // so lastActivity is computed live and realistic
  const sessionBatch: {
    userId: number;
    token: string;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
    expiresAt: Date;
    lastActiveAt: Date;
    revokedAt: Date | null;
  }[] = [];

  for (const user of userRows) {
    // Determine session profile based on user status/role
    const isInactive = user.status === "inactive";
    const sessionCount = isInactive ? randomInt(2, 4) : randomInt(5, 12);

    for (let s = 0; s < sessionCount; s++) {
      const isRecent = !isInactive && s < 2; // first 2 sessions for active users are recent
      const createdAgo = isRecent
        ? Math.random() * 2 * HOUR                 // last 2 hours
        : randomInt(1, isInactive ? 30 : 7) * DAY; // days ago

      const created = new Date(now - createdAgo);
      const sessionDuration = randomInt(15, 480) * 60 * 1000; // 15 min to 8 hours
      const expires = new Date(created.getTime() + sessionDuration);

      // lastActiveAt: for recent sessions, very close to now; for old ones, near creation
      const lastActive = isRecent
        ? new Date(now - Math.random() * 10 * 60 * 1000) // last 10 min
        : new Date(created.getTime() + Math.random() * Math.min(sessionDuration, 4 * HOUR));

      // Old sessions are revoked; recent ones for active users are still live
      const revoked = isRecent ? null : new Date(lastActive.getTime() + randomInt(1, 30) * 60 * 1000);

      sessionBatch.push({
        userId: user.id,
        token: token(),
        ipAddress: `${randomPick(["98.42", "203.0", "172.16", "10.0"])}.${randomInt(1, 254)}.${randomInt(1, 254)}`,
        userAgent: randomPick(USER_AGENTS),
        createdAt: created,
        expiresAt: expires,
        lastActiveAt: lastActive,
        revokedAt: revoked,
      });
    }
  }

  const CHUNK = 200;
  for (let i = 0; i < sessionBatch.length; i += CHUNK) {
    await db.insert(sessions).values(sessionBatch.slice(i, i + CHUNK));
  }
  console.log(`  ✓ Inserted ${sessionBatch.length} sessions`);

  // ── Endpoints ────────────────────────────────────────────────────────
  const endpointRows = await db
    .insert(endpoints)
    .values(
      ENDPOINTS_DATA.map((ep) => ({
        method: ep.method,
        path: ep.path,
        description: ep.description,
        category: ep.category,
        latencyMs: randomInt(4, 200),
        reqPerMin: randomInt(10, 1200),
        uptimePct: parseFloat((95 + Math.random() * 5).toFixed(2)),
        status: "active" as const,
      }))
    )
    .returning();
  console.log(`  ✓ Inserted ${endpointRows.length} endpoints`);

  // ── Logs (last 48 hours, ~800 entries) ───────────────────────────────
  const TWO_DAYS = 48 * HOUR;
  const logBatch: {
    timestamp: Date;
    method: string;
    endpoint: string;
    statusCode: number;
    statusText: string;
    latencyMs: number;
    requestId: string;
    payload: Record<string, unknown>;
  }[] = [];

  for (let i = 0; i < 800; i++) {
    const ep = randomPick(ENDPOINTS_DATA);
    const status = pickStatus();
    const age = Math.random() * TWO_DAYS;
    const ts = new Date(now - age);
    const latency = pickLatency(status.code, ep.method);

    logBatch.push({
      timestamp: ts,
      method: ep.method,
      endpoint: ep.path,
      statusCode: status.code,
      statusText: status.text,
      latencyMs: latency,
      requestId: uuid(),
      payload: {
        header: {
          "x-request-id": uuid(),
          "user-agent": randomPick(USER_AGENTS),
        },
        userId: randomPick([null, null, `usr_${userRows[randomInt(0, userRows.length - 1)].id}`]),
      },
    });
  }

  // Dense cluster in last 10 min so sparklines look alive
  for (let i = 0; i < 60; i++) {
    const ep = randomPick(ENDPOINTS_DATA);
    const status = pickStatus();
    const ts = new Date(now - Math.random() * 10 * 60 * 1000);
    logBatch.push({
      timestamp: ts,
      method: ep.method,
      endpoint: ep.path,
      statusCode: status.code,
      statusText: status.text,
      latencyMs: pickLatency(status.code, ep.method),
      requestId: uuid(),
      payload: { header: { "x-request-id": uuid() }, userId: null },
    });
  }

  for (let i = 0; i < logBatch.length; i += CHUNK) {
    await db.insert(logs).values(logBatch.slice(i, i + CHUNK));
  }
  console.log(`  ✓ Inserted ${logBatch.length} log entries (last 48h)`);

  // ── Webhooks ─────────────────────────────────────────────────────────
  const webhookRows = await db
    .insert(webhooks)
    .values([
      {
        name: "PagerDuty Alerts",
        url: "https://events.pagerduty.com/integration/abc123/enqueue",
        secret: "whsec_pd_" + uuid().slice(0, 16),
        events: ["log.error", "health.degraded"],
        active: true,
        lastTriggered: new Date(now - randomInt(60, 3600) * 1000),
        lastStatus: 200,
      },
      {
        name: "Slack #ops-alerts",
        url: "https://hooks.slack.com/services/T00000/B00000/XXXX",
        secret: "whsec_sl_" + uuid().slice(0, 16),
        events: ["log.error", "log.slow", "ingestion.error"],
        active: true,
        lastTriggered: new Date(now - randomInt(120, 7200) * 1000),
        lastStatus: 200,
      },
      {
        name: "Datadog Event Forwarder",
        url: "https://http-intake.logs.datadoghq.com/api/v2/logs",
        secret: null,
        events: ["log.error", "health.degraded", "ingestion.error"],
        active: false,
        lastTriggered: null,
        lastStatus: null,
      },
    ])
    .returning();
  console.log(`  ✓ Inserted ${webhookRows.length} webhooks`);

  // ── Ingestion Logs ───────────────────────────────────────────────────
  const ingestionBatch: {
    source: string;
    level: string;
    message: string;
    metadata: Record<string, unknown>;
    timestamp: Date;
    processedAt: Date | null;
  }[] = [];

  for (let i = 0; i < 120; i++) {
    const level = randomPick(
      [...Array(50).fill("info"), ...Array(30).fill("warn"), ...Array(15).fill("error"), ...Array(5).fill("fatal")] as typeof INGESTION_LEVELS[number][]
    );
    const source = randomPick(INGESTION_SOURCES);
    const message = randomPick(INGESTION_MESSAGES[level]);
    const age = Math.random() * DAY;
    const ts = new Date(now - age);

    ingestionBatch.push({
      source,
      level,
      message,
      metadata: {
        traceId: uuid(),
        source_ip: `10.0.${randomInt(1, 12)}.${randomInt(2, 254)}`,
        bytes: randomInt(128, 65536),
      },
      timestamp: ts,
      processedAt: level === "fatal" ? null : new Date(ts.getTime() + randomInt(50, 3000)),
    });
  }

  for (let i = 0; i < ingestionBatch.length; i += CHUNK) {
    await db.insert(ingestionLogs).values(ingestionBatch.slice(i, i + CHUNK));
  }
  console.log(`  ✓ Inserted ${ingestionBatch.length} ingestion log entries`);

  // ── Summary ──────────────────────────────────────────────────────────
  console.log("\n🎉 Seed complete!");
  console.log(`   • ${userRows.length} user (Ayush Paharia, admin)`);
  console.log(`   • ${sessionBatch.length} sessions (live lastActivity computed from these)`);
  console.log(`   • ${endpointRows.length} endpoints`);
  console.log(`   • ${logBatch.length} request logs (48h spread + recent burst)`);
  console.log(`   • ${webhookRows.length} webhooks`);
  console.log(`   • ${ingestionBatch.length} ingestion logs`);
  console.log("   • Metrics & sparklines are computed live from log data");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
