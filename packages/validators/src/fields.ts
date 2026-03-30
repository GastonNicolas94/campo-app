import { z } from 'zod'

export const createFieldSchema = z.object({
  name: z.string().min(2),
  location: z.string().optional(),
  totalHectares: z.number().positive().optional(),
})

export const updateFieldSchema = createFieldSchema.partial()

export type CreateFieldInput = z.infer<typeof createFieldSchema>
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>
