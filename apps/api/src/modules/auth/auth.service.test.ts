import { describe, it, expect, beforeAll } from 'vitest'
import { createTestDb, type TestDb } from '../../shared/test-db'
import { AuthRepository } from './auth.repository'
import { AuthService } from './auth.service'

process.env.JWT_SECRET = 'test-secret-32-chars-long-padding!'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-pad!'

let db: TestDb
let service: AuthService

beforeAll(async () => {
  db = await createTestDb()
  const repo = new AuthRepository(db)
  service = new AuthService(repo)
})

describe('AuthService', () => {
  describe('register', () => {
    it('crea tenant + owner y retorna tokens', async () => {
      const result = await service.register({
        tenantName: 'Estancia Los Álamos',
        email: 'owner@alamos.com',
        password: 'secret1234',
      })
      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.user.email).toBe('owner@alamos.com')
      expect(result.user.role).toBe('owner')
    })

    it('lanza error si el email ya existe', async () => {
      await service.register({
        tenantName: 'Campo Test',
        email: 'dup@test.com',
        password: 'secret1234',
      })
      await expect(
        service.register({ tenantName: 'Campo Test 2', email: 'dup@test.com', password: 'secret1234' })
      ).rejects.toThrow('El email ya está registrado')
    })
  })

  describe('login', () => {
    it('retorna tokens con credenciales válidas', async () => {
      await service.register({
        tenantName: 'Campo Login',
        email: 'login@test.com',
        password: 'mypassword123',
      })
      const result = await service.login({ email: 'login@test.com', password: 'mypassword123' })
      expect(result.accessToken).toBeDefined()
      expect(result.user.email).toBe('login@test.com')
    })

    it('lanza error con contraseña incorrecta', async () => {
      await expect(
        service.login({ email: 'login@test.com', password: 'incorrecta' })
      ).rejects.toThrow('Credenciales inválidas')
    })

    it('lanza error con email desconocido', async () => {
      await expect(
        service.login({ email: 'fantasma@test.com', password: 'pass' })
      ).rejects.toThrow('Credenciales inválidas')
    })
  })

  describe('refresh', () => {
    it('retorna nuevo access token con refresh token válido', async () => {
      const { refreshToken } = await service.register({
        tenantName: 'Campo Refresh',
        email: 'refresh@test.com',
        password: 'secret1234',
      })
      const result = await service.refresh({ refreshToken })
      expect(result.accessToken).toBeDefined()
    })
  })
})
