import { z } from 'zod'

export const createLotSchema = z.object({
  name: z.string().min(1),
  hectares: z.number().positive().optional(),
})

export const updateLotSchema = createLotSchema.partial()

export type CreateLotInput = z.infer<typeof createLotSchema>
export type UpdateLotInput = z.infer<typeof updateLotSchema>
