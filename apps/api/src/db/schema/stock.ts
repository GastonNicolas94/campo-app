import { pgTable, uuid, text, numeric, timestamp, pgEnum, date } from 'drizzle-orm/pg-core'
import { fields } from './fields'
import { users } from './users'

export const stockCategoryEnum = pgEnum('stock_category', [
  'agroquimico', 'semilla', 'combustible', 'fertilizante', 'repuesto', 'otro'
])

export const stockMovementTypeEnum = pgEnum('stock_movement_type', ['in', 'out'])

export const stockItems = pgTable('stock_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  fieldId: uuid('field_id').notNull().references(() => fields.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: stockCategoryEnum('category').notNull(),
  unit: text('unit').notNull(),
  currentQuantity: numeric('current_quantity', { precision: 10, scale: 2 }).notNull().default('0'),
  alertThreshold: numeric('alert_threshold', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => stockItems.id, { onDelete: 'cascade' }),
  type: stockMovementTypeEnum('type').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  date: date('date').notNull(),
  reason: text('reason'),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
