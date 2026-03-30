import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createActivitySchema, updateActivitySchema, patchStatusSchema } from '@campo-app/validators/activities'
import { ActivitiesRepository } from './activities.repository'
import { ActivitiesService } from './activities.service'
import { verifyAuth } from '../../shared/middleware/auth.middleware'
import { db } from '../../shared/db'

export function createActivitiesRouter() {
  const router = new Hono()
  const service = new ActivitiesService(new ActivitiesRepository(db))

  router.use('*', verifyAuth)

  router.get('/', async (c) => {
    const { tenantId } = c.get('user')
    const { lotId, campaignId, assignedTo, status } = c.req.query()
    const data = await service.list(tenantId, {
      lotId, campaignId,
      assignedTo: assignedTo === 'null' ? null : assignedTo,
      status,
    })
    return c.json({ data })
  })

  router.post('/', zValidator('json', createActivitySchema), async (c) => {
    const { sub: userId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.create(input, userId)
      return c.json({ data }, 201)
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Error' }, 400)
    }
  })

  router.get('/:id', async (c) => {
    const { tenantId } = c.get('user')
    try {
      const data = await service.getById(c.req.param('id'), tenantId)
      return c.json({ data })
    } catch {
      return c.json({ error: 'Actividad no encontrada' }, 404)
    }
  })

  router.put('/:id', zValidator('json', updateActivitySchema), async (c) => {
    const { tenantId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.update(c.req.param('id'), tenantId, input)
      return c.json({ data })
    } catch {
      return c.json({ error: 'Actividad no encontrada' }, 404)
    }
  })

  router.patch('/:id/status', zValidator('json', patchStatusSchema), async (c) => {
    const { tenantId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.patchStatus(c.req.param('id'), tenantId, input)
      return c.json({ data })
    } catch {
      return c.json({ error: 'Actividad no encontrada' }, 404)
    }
  })

  router.delete('/:id', async (c) => {
    const { tenantId } = c.get('user')
    try {
      await service.delete(c.req.param('id'), tenantId)
      return c.json({ ok: true })
    } catch {
      return c.json({ error: 'Actividad no encontrada' }, 404)
    }
  })

  return router
}
