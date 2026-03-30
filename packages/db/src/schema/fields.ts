import { pgTable, uuid, text, numeric, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const fields = pgTable('fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  location: text('location'),
  totalHectares: numeric('total_hectares', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
