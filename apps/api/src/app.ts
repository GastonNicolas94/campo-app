import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createAuthRouter } from './modules/auth/auth.router'
import { createFieldsRouter } from './modules/fields/fields.router'
import { createLotsRouter } from './modules/lots/lots.router'
import { createCampaignsRouter } from './modules/campaigns/campaigns.router'
import { createActivitiesRouter } from './modules/activities/activities.router'
import { createStockRouter } from './modules/stock/stock.router'
import { createReportsRouter } from './modules/reports/reports.router'
import { AuthRepository } from './modules/auth/auth.repository'
import { verifyAuth } from './shared/middleware/auth.middleware'
import { ResponseHelper } from './shared/response'
import { db } from './shared/db'

export function createApp() {
  const app = new Hono()

  app.use('*', logger())
  app.use('*', cors({
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  }))

  app.get('/health', (c) => ResponseHelper.success(c, { ok: true }))
  app.route('/auth', createAuthRouter())

  const authRepo = new AuthRepository(db)
  app.get('/me', verifyAuth, async (c) => {
    const { sub: userId } = c.get('user')
    const user = await authRepo.findById(userId)
    if (!user) return ResponseHelper.notFound(c, 'Usuario no encontrado')
    const { passwordHash: _omit, ...safeUser } = user
    return ResponseHelper.success(c, safeUser)
  })

  app.route('/fields', createFieldsRouter())
  app.route('/', createLotsRouter())
  app.route('/', createCampaignsRouter())
  app.route('/activities', createActivitiesRouter())
  app.route('/stock', createStockRouter())
  app.route('/reports', createReportsRouter())

  return app
}

export type AppType = ReturnType<typeof createApp>
