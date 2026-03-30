import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '@campo-app/db'

export async function createTestDb() {
  const client = new PGlite()
  const db = drizzle(client, { schema })

  // Create tables directly (no migration files needed)
  // pglite has gen_random_uuid built-in
  try {
    await client.exec(`CREATE TYPE role AS ENUM ('owner', 'manager', 'operator', 'accountant')`)
  } catch {
    // Type may already exist
  }

  try {
    await client.exec(`
      CREATE TABLE tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch {
    // Table may already exist
  }

  try {
    await client.exec(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        phone TEXT,
        role role NOT NULL DEFAULT 'owner',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch {
    // Table may already exist
  }

  return db
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>
