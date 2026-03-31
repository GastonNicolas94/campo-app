import type { FieldsRepository } from './fields.repository'
import type { CreateFieldInput, UpdateFieldInput } from '../../validators/fields'

export class FieldsService {
  constructor(private repo: FieldsRepository) {}

  async getAll(tenantId: string) {
    return this.repo.findAll(tenantId)
  }

  async getById(id: string, tenantId: string) {
    const field = await this.repo.findById(id, tenantId)
    if (!field) throw new Error('Establecimiento no encontrado')
    return field
  }

  async create(tenantId: string, input: CreateFieldInput) {
    return this.repo.create(tenantId, input)
  }

  async update(id: string, tenantId: string, input: UpdateFieldInput) {
    const field = await this.repo.update(id, tenantId, input)
    if (!field) throw new Error('Establecimiento no encontrado')
    return field
  }

  async delete(id: string, tenantId: string) {
    const field = await this.repo.delete(id, tenantId)
    if (!field) throw new Error('Establecimiento no encontrado')
    return field
  }
}
