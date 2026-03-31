import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const roleEnum = pgEnum('role', ['owner', 'manager', 'operator', 'accountant'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  phone: text('phone'),
  role: roleEnum('role').notNull().default('owner'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
