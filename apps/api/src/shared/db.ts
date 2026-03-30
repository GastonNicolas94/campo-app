import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@campo-app/db'
import type { PgliteDatabase } from 'drizzle-orm/pglite'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client, { schema })

// Union type compatible con el driver de producción y el de tests
export type Db = typeof db | PgliteDatabase<typeof schema>
