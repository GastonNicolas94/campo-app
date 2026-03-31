import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createCampaignSchema, updateCampaignSchema, campaignResultSchema } from '../../validators/campaigns'
import { CampaignsRepository } from './campaigns.repository'
import { CampaignsService } from './campaigns.service'
import { LotsRepository } from '../lots/lots.repository'
import { verifyAuth } from '../../shared/middleware/auth.middleware'
import { db } from '../../shared/db'

export function createCampaignsRouter() {
  const router = new Hono()
  const campaignsRepo = new CampaignsRepository(db)
  const lotsRepo = new LotsRepository(db)
  const service = new CampaignsService(campaignsRepo, lotsRepo)

  router.use('*', verifyAuth)

  router.get('/lots/:lotId/campaigns', async (c) => {
    const { tenantId } = c.get('user')
    try {
      const data = await service.getByLot(c.req.param('lotId'), tenantId)
      return c.json({ data })
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Error' }, 404)
    }
  })

  router.post('/lots/:lotId/campaigns', zValidator('json', createCampaignSchema), async (c) => {
    const { tenantId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.create(c.req.param('lotId'), tenantId, input)
      return c.json({ data }, 201)
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Error' }, 400)
    }
  })

  router.get('/campaigns/:id', async (c) => {
    const { tenantId } = c.get('user')
    try {
      const data = await service.getById(c.req.param('id'), tenantId)
      return c.json({ data })
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Error' }, 404)
    }
  })

  router.put('/campaigns/:id', zValidator('json', updateCampaignSchema), async (c) => {
    const { tenantId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.update(c.req.param('id'), tenantId, input)
      return c.json({ data })
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Error' }, 404)
    }
  })

  router.post('/campaigns/:id/results', zValidator('json', campaignResultSchema), async (c) => {
    const { tenantId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.close(c.req.param('id'), tenantId, input)
      return c.json({ data }, 201)
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Error' }, 400)
    }
  })

  return router
}
