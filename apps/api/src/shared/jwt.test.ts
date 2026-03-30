import { describe, it, expect } from 'vitest'
import { signAccessToken, signRefreshToken, verifyToken } from './jwt'

process.env.JWT_SECRET = 'test-secret-32-chars-long-padding!'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-pad!'

describe('jwt utils', () => {
  const payload = { sub: 'user-123', tenantId: 'tenant-456', role: 'owner' as const }

  it('firma y verifica un access token', async () => {
    const token = await signAccessToken(payload)
    const decoded = await verifyToken(token, 'access')
    expect(decoded.sub).toBe('user-123')
    expect(decoded.tenantId).toBe('tenant-456')
    expect(decoded.role).toBe('owner')
  })

  it('firma y verifica un refresh token', async () => {
    const token = await signRefreshToken(payload)
    const decoded = await verifyToken(token, 'refresh')
    expect(decoded.sub).toBe('user-123')
  })

  it('rechaza access token verificado como refresh', async () => {
    const token = await signAccessToken(payload)
    await expect(verifyToken(token, 'refresh')).rejects.toThrow()
  })
})
