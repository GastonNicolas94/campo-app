import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createLotSchema, updateLotSchema } from '../../validators/lots'
import { LotsRepository } from './lots.repository'
import { LotsService } from './lots.service'
import { FieldsRepository } from '../fields/fields.repository'
import { verifyAuth } from '../../shared/middleware/auth.middleware'
import { db } from '../../shared/db'
import { ResponseHelper } from '../../shared/response'
import { paginationSchema, paginationToOffset } from '../../shared/pagination'

export function createLotsRouter() {
  const router = new Hono()
  const lotsRepo = new LotsRepository(db)
  const fieldsRepo = new FieldsRepository(db)
  const service = new LotsService(lotsRepo, fieldsRepo)

  router.use('*', verifyAuth)

  router.get('/fields/:fieldId/lots', async (c) => {
    const { tenantId } = c.get('user')
    const parsed = paginationSchema.safeParse(c.req.query())
    if (!parsed.success) return ResponseHelper.badRequest(c, 'Parámetros de paginación inválidos')
    const { page, pageSize } = parsed.data
    const { limit, offset } = paginationToOffset(page, pageSize)
    try {
      const result = await service.getByFieldPaginated(c.req.param('fieldId'), tenantId, limit, offset)
      return ResponseHelper.paginated(c, result.rows, { total: result.total, page, pageSize })
    } catch (err) {
      return ResponseHelper.notFound(c, err instanceof Error ? err.message : 'Error')
    }
  })

  router.post('/fields/:fieldId/lots', zValidator('json', createLotSchema), async (c) => {
    const { tenantId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.create(c.req.param('fieldId'), tenantId, input)
      return ResponseHelper.created(c, data)
    } catch (err) {
      return ResponseHelper.badRequest(c, err instanceof Error ? err.message : 'Error')
    }
  })

  router.get('/lots/:id', async (c) => {
    const { tenantId } = c.get('user')
    try {
      const data = await service.getById(c.req.param('id'), tenantId)
      return ResponseHelper.success(c, data)
    } catch (err) {
      return ResponseHelper.notFound(c, err instanceof Error ? err.message : 'Error')
    }
  })

  router.put('/lots/:id', zValidator('json', updateLotSchema), async (c) => {
    const { tenantId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.update(c.req.param('id'), tenantId, input)
      return ResponseHelper.success(c, data)
    } catch (err) {
      return ResponseHelper.notFound(c, err instanceof Error ? err.message : 'Error')
    }
  })

  router.delete('/lots/:id', async (c) => {
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
