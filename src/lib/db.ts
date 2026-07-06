import postgres from "postgres";

let client: ReturnType<typeof postgres> | null = null;
export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  client ??= postgres(process.env.DATABASE_URL, { ssl: "require", max: 5 });
  return client;
}

export async function ensureSchema() {
  const sql = getDb();
  await sql`CREATE TABLE IF NOT EXISTS quote_requests (
    id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL,
    company TEXT, pickup TEXT NOT NULL, delivery TEXT NOT NULL, service_type TEXT NOT NULL,
    requested_date DATE, notes TEXT, status TEXT NOT NULL DEFAULT 'new', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}
