import type { LotsRepository } from './lots.repository'
import type { FieldsRepository } from '../fields/fields.repository'
import type { CreateLotInput, UpdateLotInput } from '../../validators/lots'

export class LotsService {
  constructor(
    private repo: LotsRepository,
    private fieldsRepo: FieldsRepository,
  ) {}

  async getByField(fieldId: string, tenantId: string) {
    const field = await this.fieldsRepo.findById(fieldId, tenantId)
    if (!field) throw new Error('Establecimiento no encontrado')
    return this.repo.findByField(fieldId)
  }

  async getById(id: string, tenantId: string) {
    const lot = await this.repo.findByIdAndTenant(id, tenantId)
    if (!lot) throw new Error('Lote no encontrado')
    return lot
  }

  async create(fieldId: string, tenantId: string, input: CreateLotInput) {
    const field = await this.fieldsRepo.findById(fieldId, tenantId)
    if (!field) throw new Error('Establecimiento no encontrado')
    return this.repo.create(fieldId, input)
  }

  async update(id: string, tenantId: string, input: UpdateLotInput) {
    const lot = await this.repo.findByIdAndTenant(id, tenantId)
    if (!lot) throw new Error('Lote no encontrado')
    const updated = await this.repo.update(id, input)
    if (!updated) throw new Error('Lote no encontrado')
    return updated
  }

  async delete(id: string, tenantId: string) {
    const lot = await this.repo.findByIdAndTenant(id, tenantId)
    if (!lot) throw new Error('Lote no encontrado')
    await this.repo.delete(id)
  }
}
