import { z } from 'zod'

const harvestAfterSowing = (data: { sowingDate?: string; harvestDate?: string }) => {
  if (!data.harvestDate || !data.sowingDate) return true
  return new Date(data.harvestDate) > new Date(data.sowingDate)
}

const harvestDateError = {
  message: 'La fecha de cosecha debe ser posterior a la fecha de siembra',
  path: ['harvestDate'],
}

const campaignBaseSchema = z.object({
  crop: z.string().min(1),
  variety: z.string().optional(),
  sowingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  harvestDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const createCampaignSchema = campaignBaseSchema.refine(harvestAfterSowing, harvestDateError)

export const updateCampaignSchema = campaignBaseSchema.partial().refine(harvestAfterSowing, harvestDateError)

export const campaignResultSchema = z.object({
  yieldAmount: z.number().positive().optional(),
  yieldUnit: z.enum(['qq_ha', 'tn_ha']).optional(),
  totalRevenue: z.number().positive().optional(),
  notes: z.string().optional(),
})

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>
export type CampaignResultInput = z.infer<typeof campaignResultSchema>
