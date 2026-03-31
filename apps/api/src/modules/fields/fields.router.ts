import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createFieldSchema, updateFieldSchema } from '../../validators/fields'
import { FieldsRepository } from './fields.repository'
import { FieldsService } from './fields.service'
import { verifyAuth } from '../../shared/middleware/auth.middleware'
import { db } from '../../shared/db'
import { ResponseHelper } from '../../shared/response'

export function createFieldsRouter() {
  const router = new Hono()
  const repo = new FieldsRepository(db)
  const service = new FieldsService(repo)

  router.use('*', verifyAuth)

  router.get('/', async (c) => {
    const { tenantId } = c.get('user')
    const data = await service.getAll(tenantId)
    return ResponseHelper.success(c, data)
  })

  router.post('/', zValidator('json', createFieldSchema), async (c) => {
    const { tenantId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.create(tenantId, input)
      return ResponseHelper.created(c, data)
    } catch (err) {
      return ResponseHelper.badRequest(c, err instanceof Error ? err.message : 'Error')
    }
  })

  router.get('/:id', async (c) => {
    const { tenantId } = c.get('user')
    try {
      const data = await service.getById(c.req.param('id'), tenantId)
      return ResponseHelper.success(c, data)
    } catch (err) {
      return ResponseHelper.notFound(c, err instanceof Error ? err.message : 'Error')
    }
  })

  router.put('/:id', zValidator('json', updateFieldSchema), async (c) => {
    const { tenantId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.update(c.req.param('id'), tenantId, input)
      return ResponseHelper.success(c, data)
    } catch (err) {
      return ResponseHelper.notFound(c, err instanceof Error ? err.message : 'Error')
    }
  })

  router.delete('/:id', async (c) => {
    const { tenantId } = c.get('user')
    try {
      await service.delete(c.req.param('id'), tenantId)
      return ResponseHelper.deleted(c)
    } catch (err) {
      return ResponseHelper.notFound(c, err instanceof Error ? err.message : 'Error')
    }
  })

  return router
}
