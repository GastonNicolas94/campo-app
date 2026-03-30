import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createAuthRouter } from './modules/auth/auth.router'
import { AuthRepository } from './modules/auth/auth.repository'
import { verifyAuth } from './shared/middleware/auth.middleware'
import { db } from './shared/db'

export function createApp() {
  const app = new Hono()

  app.use('*', logger())
  app.use('*', cors({
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  }))

  app.get('/health', (c) => c.json({ ok: true }))
  app.route('/auth', createAuthRouter())

  app.get('/me', verifyAuth, async (c) => {
    const repo = new AuthRepository(db)
    const { sub: userId } = c.get('user')
    const user = await repo.findById(userId)
    if (!user) return c.json({ error: 'Usuario no encontrado' }, 404)
    const { passwordHash: _omit, ...safeUser } = user
    return c.json({ data: safeUser })
  })

  return app
}

export type AppType = ReturnType<typeof createApp>
