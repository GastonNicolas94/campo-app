import { z } from 'zod'

const categories = ['agroquimico', 'semilla', 'combustible', 'fertilizante', 'repuesto', 'otro'] as const

export const createStockItemSchema = z.object({
  fieldId: z.string().uuid(),
  name: z.string().min(1, 'El nombre es requerido'),
  category: z.enum(categories),
  unit: z.string().min(1, 'La unidad es requerida'),
  currentQuantity: z.number().min(0).default(0),
  alertThreshold: z.number().min(0).optional(),
})

export const updateStockItemSchema = createStockItemSchema.omit({ fieldId: true }).partial()

export const createMovementSchema = z.object({
  type: z.enum(['in', 'out']),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  date: z.string().date(),
  reason: z.string().optional(),
})

export type CreateStockItemInput = z.infer<typeof createStockItemSchema>
export type UpdateStockItemInput = z.infer<typeof updateStockItemSchema>
export type CreateMovementInput = z.infer<typeof createMovementSchema>
