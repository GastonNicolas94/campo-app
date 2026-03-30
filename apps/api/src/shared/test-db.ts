import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '@campo-app/db'
import { v4 as uuidv4 } from 'uuid'

export async function createTestDb() {
  const client = new PGlite()
  const db = drizzle(client, { schema })

  // Create tables directly from schema (no migration files needed)
  try {
    await client.exec("CREATE TYPE role AS ENUM ('owner', 'manager', 'operator', 'accountant')")
  } catch {
    // Type may already exist
  }

  try {
    await client.exec("CREATE TABLE tenants (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TEXT)")
  } catch {
    // Table may already exist
  }

  try {
    await client.exec("CREATE TABLE users (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, email TEXT UNIQUE, password_hash TEXT NOT NULL, phone TEXT, role TEXT, created_at TEXT)")
  } catch {
    // Table may already exist
  }

  return db
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>
