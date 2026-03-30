import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { verifyAuth } from './auth.middleware'
import { signAccessToken } from '../jwt'

process.env.JWT_SECRET = 'test-secret-32-chars-long-padding!'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-pad!'

describe('verifyAuth middleware', () => {
  const app = new Hono()
  app.use('/protected', verifyAuth)
  app.get('/protected', (c) => {
    const user = c.get('user')
    return c.json({ userId: user.sub, tenantId: user.tenantId })
  })

  it('pasa token válido e inyecta user en contexto', async () => {
    const token = await signAccessToken({ sub: 'u1', tenantId: 't1', role: 'owner' })
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.userId).toBe('u1')
    expect(body.tenantId).toBe('t1')
  })

  it('retorna 401 si no hay token', async () => {
    const res = await app.request('/protected')
    expect(res.status).toBe(401)
  })

  it('retorna 401 para token inválido', async () => {
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer token.invalido.aqui' },
    })
    expect(res.status).toBe(401)
  })
})
