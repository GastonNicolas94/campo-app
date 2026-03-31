import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createFieldSchema, updateFieldSchema } from '../../validators/fields'
import { FieldsRepository } from './fields.repository'
import { FieldsService } from './fields.service'
import { verifyAuth } from '../../shared/middleware/auth.middleware'
import { db } from '../../shared/db'

export function createFieldsRouter() {
  const router = new Hono()
  const repo = new FieldsRepository(db)
  const service = new FieldsService(repo)

  router.use('*', verifyAuth)

  router.get('/', async (c) => {
    const { tenantId } = c.get('user')
    const data = await service.getAll(tenantId)
    return c.json({ data })
  })

  router.post('/', zValidator('json', createFieldSchema), async (c) => {
    const { tenantId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.create(tenantId, input)
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
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Error' }, 404)
    }
  })

  router.put('/:id', zValidator('json', updateFieldSchema), async (c) => {
    const { tenantId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.update(c.req.param('id'), tenantId, input)
      return c.json({ data })
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Error' }, 404)
    }
  })

  router.delete('/:id', async (c) => {
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
