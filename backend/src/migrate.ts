import { neon } from "@neondatabase/serverless";
import "dotenv/config";

async function migrate() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE");
  console.log("clerk_id column added");
  await sql("TRUNCATE users, endpoints, logs, metrics RESTART IDENTITY CASCADE");
  console.log("Tables truncated");
  process.exit(0);
}

migrate().catch((e) => { console.error(e); process.exit(1); });
