import bcrypt from 'bcryptjs'
import type { UsersRepository } from './users.repository'
import type { InviteUserInput, UpdateUserRoleInput } from '../../validators/users'
import { paginationToOffset } from '../../shared/pagination'

export class UsersService {
  constructor(private repo: UsersRepository) {}

  async list(tenantId: string, page: number, pageSize: number) {
    const { limit, offset } = paginationToOffset(page, pageSize)
    return this.repo.findByTenant(tenantId, limit, offset)
  }

  async invite(tenantId: string, input: InviteUserInput) {
    const existing = await this.repo.findByEmailAndTenant(input.email, tenantId)
    if (existing) throw new Error('El email ya está registrado en este tenant')
    const passwordHash = await bcrypt.hash(input.password, 10)
    return this.repo.create(tenantId, input, passwordHash)
  }

  async updateRole(id: string, tenantId: string, input: UpdateUserRoleInput) {
    const user = await this.repo.findByIdAndTenant(id, tenantId)
    if (!user) throw new Error('Usuario no encontrado')
    if (user.role === 'owner') throw new Error('No se puede modificar el rol del owner')
    return this.repo.updateRole(id, tenantId, input.role)
  }

  async remove(id: string, tenantId: string, requesterId: string) {
    const user = await this.repo.findByIdAndTenant(id, tenantId)
    if (!user) throw new Error('Usuario no encontrado')
    if (user.role === 'owner') throw new Error('No se puede eliminar al owner')
    if (user.id === requesterId) throw new Error('No podés eliminarte a vos mismo')
    await this.repo.delete(id, tenantId)
  }
}
