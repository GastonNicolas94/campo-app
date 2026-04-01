import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createStockItemSchema, updateStockItemSchema, createMovementSchema } from '../../validators/stock'
import { StockRepository } from './stock.repository'
import { StockService } from './stock.service'
import { verifyAuth } from '../../shared/middleware/auth.middleware'
import { db } from '../../shared/db'
import { ResponseHelper } from '../../shared/response'

export function createStockRouter() {
  const router = new Hono()
  const service = new StockService(new StockRepository(db))

  router.use('*', verifyAuth)

  // GET /stock/items?fieldId=
  router.get('/items', async (c) => {
    const { tenantId } = c.get('user')
    const { fieldId } = c.req.query()
    const data = fieldId
      ? await service.listByField(fieldId, tenantId)
      : await service.listByTenant(tenantId)
    return ResponseHelper.success(c, data)
  })

  // POST /stock/items
  router.post('/items', zValidator('json', createStockItemSchema), async (c) => {
    const input = c.req.valid('json')
    try {
      const data = await service.create(input)
      return ResponseHelper.created(c, data)
    } catch (err) {
      return ResponseHelper.badRequest(c, err instanceof Error ? err.message : 'Error')
    }
  })

  // GET /stock/items/:id
  router.get('/items/:id', async (c) => {
    const { tenantId } = c.get('user')
    try {
      const data = await service.getById(c.req.param('id'), tenantId)
      return ResponseHelper.success(c, data)
    } catch {
      return ResponseHelper.notFound(c, 'Item no encontrado')
    }
  })

  // PUT /stock/items/:id
  router.put('/items/:id', zValidator('json', updateStockItemSchema), async (c) => {
    const { tenantId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.update(c.req.param('id'), tenantId, input)
      return ResponseHelper.success(c, data)
    } catch {
      return ResponseHelper.notFound(c, 'Item no encontrado')
    }
  })

  // DELETE /stock/items/:id
  router.delete('/items/:id', async (c) => {
    const { tenantId } = c.get('user')
    try {
      await service.delete(c.req.param('id'), tenantId)
      return ResponseHelper.deleted(c)
    } catch {
      return ResponseHelper.notFound(c, 'Item no encontrado')
    }
  })

  // POST /stock/items/:id/movements
  router.post('/items/:id/movements', zValidator('json', createMovementSchema), async (c) => {
    const { tenantId, sub: userId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.addMovement(c.req.param('id'), tenantId, input, userId)
      return ResponseHelper.created(c, data)
    } catch (err) {
      return ResponseHelper.badRequest(c, err instanceof Error ? err.message : 'Error')
    }
  })

  // GET /stock/items/:id/movements
  router.get('/items/:id/movements', async (c) => {
    const { tenantId } = c.get('user')
    try {
      const data = await service.getMovements(c.req.param('id'), tenantId)
      return ResponseHelper.success(c, data)
    } catch {
      return ResponseHelper.notFound(c, 'Item no encontrado')
    }
  })

  // GET /stock/alerts
  router.get('/alerts', async (c) => {
    const { tenantId } = c.get('user')
    const data = await service.getAlerts(tenantId)
    return ResponseHelper.success(c, data)
  })

  return router
}
