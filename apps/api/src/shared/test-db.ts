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

  try {
    await client.exec(`CREATE TYPE campaign_status AS ENUM ('active', 'closed')`)
  } catch {}

  try {
    await client.exec(`CREATE TYPE yield_unit AS ENUM ('qq_ha', 'tn_ha')`)
  } catch {}

  try {
    await client.exec(`
      CREATE TABLE fields (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        location TEXT,
        total_hectares NUMERIC(10,2),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `)
  } catch {}

  try {
    await client.exec(`
      CREATE TABLE lots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        hectares NUMERIC(10,2),
        geometry JSONB,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `)
  } catch {}

  try {
    await client.exec(`
      CREATE TABLE campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
        crop TEXT NOT NULL,
        variety TEXT,
        sowing_date DATE NOT NULL,
        harvest_date DATE,
        status campaign_status NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `)
  } catch {}

  try {
    await client.exec(`
      CREATE TABLE campaign_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        yield_amount NUMERIC(10,2),
        yield_unit yield_unit,
        total_revenue NUMERIC(12,2),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `)
  } catch {}

  try {
    await client.exec(`CREATE TYPE activity_status AS ENUM ('pending', 'done', 'skipped')`)
  } catch {}

  try {
    await client.exec(`
      CREATE TABLE activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lot_id UUID REFERENCES lots(id) ON DELETE CASCADE,
        campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        due_date DATE,
        status activity_status NOT NULL DEFAULT 'pending',
        completion_notes TEXT,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `)
  } catch {}

  return db
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>
