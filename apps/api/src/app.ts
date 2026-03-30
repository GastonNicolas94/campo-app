import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

export function createApp() {
  const app = new Hono()

  app.use('*', logger())
  app.use('*', cors({
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  }))

  app.get('/health', (c) => c.json({ ok: true }))

  return app
}

export type AppType = ReturnType<typeof createApp>
