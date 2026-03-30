import type { ActivitiesRepository } from './activities.repository'
import type { CreateActivityInput, UpdateActivityInput, PatchStatusInput } from '@campo-app/validators/activities'

export class ActivitiesService {
  constructor(private repo: ActivitiesRepository) {}

  async list(tenantId: string, filters: { lotId?: string; campaignId?: string; assignedTo?: string | null; status?: string }) {
    return this.repo.findByTenant(tenantId, filters)
  }

  async getById(id: string, tenantId: string) {
    const activity = await this.repo.findByIdAndTenant(id, tenantId)
    if (!activity) throw new Error('Actividad no encontrada')
    return activity
  }

  async create(input: CreateActivityInput, createdBy: string) {
    return this.repo.create({ ...input, createdBy })
  }

  async update(id: string, tenantId: string, input: UpdateActivityInput) {
    await this.getById(id, tenantId)
    const updated = await this.repo.update(id, input)
    if (!updated) throw new Error('Actividad no encontrada')
    return updated
  }

  async patchStatus(id: string, tenantId: string, input: PatchStatusInput) {
    await this.getById(id, tenantId)
    const updated = await this.repo.patchStatus(id, input)
    if (!updated) throw new Error('Actividad no encontrada')
    return updated
  }

  async delete(id: string, tenantId: string) {
    await this.getById(id, tenantId)
    const deleted = await this.repo.delete(id)
    if (!deleted) throw new Error('Actividad no encontrada')
    return deleted
  }
}
