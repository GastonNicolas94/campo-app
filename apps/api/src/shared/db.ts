import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../db'
import type { PgliteDatabase } from 'drizzle-orm/pglite'

const client = postgres(process.env.DATABASE_URL!, { ssl: 'require' })
export const db = drizzle(client, { schema })

// Union type compatible con el driver de producción y el de tests
export type Db = typeof db | PgliteDatabase<typeof schema>
