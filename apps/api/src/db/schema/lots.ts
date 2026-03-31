import { pgTable, uuid, text, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { fields } from './fields'

export const lots = pgTable('lots', {
  id: uuid('id').primaryKey().defaultRandom(),
  fieldId: uuid('field_id').notNull().references(() => fields.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  hectares: numeric('hectares', { precision: 10, scale: 2 }),
  geometry: jsonb('geometry'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
