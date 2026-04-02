import { z } from 'zod'

export const createLotSchema = z.object({
  name: z.string().min(1),
  hectares: z.number().positive().optional(),
})

export const updateLotSchema = createLotSchema.partial()

export const updateLotGeometrySchema = z.object({
  geometry: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
  }).nullable(),
})

export type CreateLotInput = z.infer<typeof createLotSchema>
export type UpdateLotInput = z.infer<typeof updateLotSchema>
export type UpdateLotGeometryInput = z.infer<typeof updateLotGeometrySchema>
