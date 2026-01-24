import { createClient } from '@libsql/client'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export { client as db }

export async function initializeSchema() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      state_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_events_updated_at
    ON events(updated_at DESC)
  `)
}
