import { neon } from "@neondatabase/serverless";
import "dotenv/config";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    last_active_at TIMESTAMP DEFAULT NOW(),
    revoked_at TIMESTAMP
  )`;
  console.log("sessions table created");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
