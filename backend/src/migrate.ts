import { neon } from "@neondatabase/serverless";
import "dotenv/config";

async function migrate() {
  const sql = neon(process.env.DATABASE_URL!);

  // Add webhooks table
  await sql(`CREATE TABLE IF NOT EXISTS webhooks (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    secret TEXT,
    events JSONB DEFAULT '[]',
    active BOOLEAN DEFAULT true,
    last_triggered TIMESTAMP,
    last_status INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
  )`);
  console.log("webhooks table created");

  // Add ingestion_logs table
  await sql(`CREATE TABLE IF NOT EXISTS ingestion_logs (
    id SERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    level VARCHAR(10) NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
  )`);
  console.log("ingestion_logs table created");

  // Ensure clerk_id column exists
  await sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE");
  console.log("clerk_id column ensured");

  process.exit(0);
}

migrate().catch((e) => { console.error(e); process.exit(1); });
