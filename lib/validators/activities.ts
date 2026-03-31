import { z } from 'zod'

export const createActivitySchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  lotId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().date().optional(),
})

export const updateActivitySchema = createActivitySchema.partial()

export const patchStatusSchema = z.object({
  status: z.enum(['done', 'skipped']),
  completionNotes: z.string().optional(),
})

export type CreateActivityInput = z.infer<typeof createActivitySchema>
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>
export type PatchStatusInput = z.infer<typeof patchStatusSchema>
