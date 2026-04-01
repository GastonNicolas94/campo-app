import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createStockItemSchema, updateStockItemSchema, createMovementSchema } from '../../validators/stock'
import { StockRepository } from './stock.repository'
import { StockService } from './stock.service'
import { verifyAuth } from '../../shared/middleware/auth.middleware'
import { db } from '../../shared/db'

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
    return c.json({ data })
  })

  // POST /stock/items
  router.post('/items', zValidator('json', createStockItemSchema), async (c) => {
    const input = c.req.valid('json')
    try {
      const data = await service.create(input)
      return c.json({ data }, 201)
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Error' }, 400)
    }
  })

  // GET /stock/items/:id
  router.get('/items/:id', async (c) => {
    const { tenantId } = c.get('user')
    try {
      const data = await service.getById(c.req.param('id'), tenantId)
      return c.json({ data })
    } catch {
      return c.json({ error: 'Item no encontrado' }, 404)
    }
  })

  // PUT /stock/items/:id
  router.put('/items/:id', zValidator('json', updateStockItemSchema), async (c) => {
    const { tenantId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.update(c.req.param('id'), tenantId, input)
      return c.json({ data })
    } catch {
      return c.json({ error: 'Item no encontrado' }, 404)
    }
  })

  // DELETE /stock/items/:id
  router.delete('/items/:id', async (c) => {
    const { tenantId } = c.get('user')
    try {
      await service.delete(c.req.param('id'), tenantId)
      return c.json({ ok: true })
    } catch {
      return c.json({ error: 'Item no encontrado' }, 404)
    }
  })

  // POST /stock/items/:id/movements
  router.post('/items/:id/movements', zValidator('json', createMovementSchema), async (c) => {
    const { tenantId, sub: userId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.addMovement(c.req.param('id'), tenantId, input, userId)
      return c.json({ data }, 201)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      const status = message.includes('Stock insuficiente') ? 422 : 400
      return c.json({ error: message }, status as 422 | 400)
    }
  })

  // GET /stock/items/:id/movements
  router.get('/items/:id/movements', async (c) => {
    const { tenantId } = c.get('user')
    try {
      const data = await service.getMovements(c.req.param('id'), tenantId)
      return c.json({ data })
    } catch {
      return c.json({ error: 'Item no encontrado' }, 404)
    }
  })

  // GET /stock/alerts
  router.get('/alerts', async (c) => {
    const { tenantId } = c.get('user')
    const data = await service.getAlerts(tenantId)
    return c.json({ data })
  })

  return router
}
