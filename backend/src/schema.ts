import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  integer,
  real,
  timestamp,
  jsonb,
  varchar,
  pgPolicy,
} from "drizzle-orm/pg-core";
import {
  authenticatedRole,
  anonymousRole,
  authUid,
  crudPolicy,
} from "drizzle-orm/neon";

// Users table — authenticated users can read all, only admins can modify
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: varchar("role", { length: 20 }).notNull().default("viewer"),
  authLevel: text("auth_level").notNull().default("Read-only Analytics"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  avatarUrl: text("avatar_url"),
  lastActivity: text("last_activity").default("Just now"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Authenticated users can read all users
  pgPolicy("users_select_authenticated", {
    for: "select",
    to: authenticatedRole,
    using: sql`true`,
  }),
  // Authenticated users can only update their own record
  pgPolicy("users_update_own", {
    for: "update",
    to: authenticatedRole,
    using: sql`clerk_id = (select auth.user_id())`,
    withCheck: sql`clerk_id = (select auth.user_id())`,
  }),
  // Anonymous users can read (for public dashboard)
  pgPolicy("users_select_anon", {
    for: "select",
    to: anonymousRole,
    using: sql`true`,
  }),
]);

// Endpoints table — read for all, write for authenticated
export const endpoints = pgTable("endpoints", {
  id: serial("id").primaryKey(),
  method: varchar("method", { length: 10 }).notNull(),
  path: text("path").notNull(),
  description: text("description"),
  category: text("category"),
  latencyMs: integer("latency_ms").default(0),
  reqPerMin: integer("req_per_min").default(0),
  uptimePct: real("uptime_pct").default(100),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
}, () => [
  crudPolicy({ role: authenticatedRole, read: true, modify: true }),
  crudPolicy({ role: anonymousRole, read: true, modify: false }),
]);

// Logs table — read for all, insert for authenticated only
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  method: varchar("method", { length: 10 }).notNull(),
  endpoint: text("endpoint").notNull(),
  statusCode: integer("status_code").notNull(),
  statusText: text("status_text").notNull(),
  latencyMs: integer("latency_ms").default(0),
  requestId: text("request_id"),
  payload: jsonb("payload"),
}, () => [
  crudPolicy({ role: authenticatedRole, read: true, modify: true }),
  crudPolicy({ role: anonymousRole, read: true, modify: false }),
]);

// Metrics table — read-only for everyone
export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  value: text("value").notNull(),
  change: text("change"),
  changeDirection: varchar("change_direction", { length: 10 }).default("up"),
  category: text("category").default("general"),
  recordedAt: timestamp("recorded_at").defaultNow(),
}, () => [
  crudPolicy({ role: authenticatedRole, read: true, modify: true }),
  crudPolicy({ role: anonymousRole, read: true, modify: false }),
]);
