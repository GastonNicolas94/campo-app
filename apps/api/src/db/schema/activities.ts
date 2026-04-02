import { pgTable, uuid, text, date, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { lots } from './lots'
import { campaigns } from './campaigns'
import { users } from './users'

export const activityStatusEnum = pgEnum('activity_status', ['pending', 'done', 'skipped'])
export const activityTypeEnum = pgEnum('activity_type', ['siembra', 'fertilizacion', 'riego', 'cosecha', 'fumigacion', 'laboreo', 'otro'])

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  lotId: uuid('lot_id').references(() => lots.id, { onDelete: 'cascade' }),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: date('due_date'),
  status: activityStatusEnum('status').notNull().default('pending'),
  type: activityTypeEnum('type'),
  completionNotes: text('completion_notes'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
