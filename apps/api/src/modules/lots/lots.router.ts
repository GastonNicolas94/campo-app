import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createLotSchema, updateLotSchema } from '../../validators/lots'
import { LotsRepository } from './lots.repository'
import { LotsService } from './lots.service'
import { FieldsRepository } from '../fields/fields.repository'
import { verifyAuth } from '../../shared/middleware/auth.middleware'
import { db } from '../../shared/db'

export function createLotsRouter() {
  const router = new Hono()
  const lotsRepo = new LotsRepository(db)
  const fieldsRepo = new FieldsRepository(db)
  const service = new LotsService(lotsRepo, fieldsRepo)

  router.use('*', verifyAuth)

  router.get('/fields/:fieldId/lots', async (c) => {
    const { tenantId } = c.get('user')
    try {
      const data = await service.getByField(c.req.param('fieldId'), tenantId)
      return c.json({ data })
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Error' }, 404)
    }
  })

  router.post('/fields/:fieldId/lots', zValidator('json', createLotSchema), async (c) => {
    const { tenantId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.create(c.req.param('fieldId'), tenantId, input)
      return c.json({ data }, 201)
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Error' }, 400)
    }
  })

  router.get('/lots/:id', async (c) => {
    const { tenantId } = c.get('user')
    try {
      const data = await service.getById(c.req.param('id'), tenantId)
      return c.json({ data })
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Error' }, 404)
    }
  })

  router.put('/lots/:id', zValidator('json', updateLotSchema), async (c) => {
    const { tenantId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.update(c.req.param('id'), tenantId, input)
      return c.json({ data })
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Error' }, 404)
    }
  })

  router.delete('/lots/:id', async (c) => {
    const { tenantId } = c.get('user')
    try {
      await service.delete(c.req.param('id'), tenantId)
      return c.json({ data: { ok: true } })
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Error' }, 404)
    }
  })

  return router
}
