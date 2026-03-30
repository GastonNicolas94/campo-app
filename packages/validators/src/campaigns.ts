import { z } from 'zod'

export const createCampaignSchema = z.object({
  crop: z.string().min(1),
  variety: z.string().optional(),
  sowingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  harvestDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const updateCampaignSchema = createCampaignSchema.partial()

export const campaignResultSchema = z.object({
  yieldAmount: z.number().positive().optional(),
  yieldUnit: z.enum(['qq_ha', 'tn_ha']).optional(),
  totalRevenue: z.number().positive().optional(),
  notes: z.string().optional(),
})

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>
export type CampaignResultInput = z.infer<typeof campaignResultSchema>
