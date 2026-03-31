import type { CampaignsRepository } from './campaigns.repository'
import type { LotsRepository } from '../lots/lots.repository'
import type { CreateCampaignInput, UpdateCampaignInput, CampaignResultInput } from '../../validators/campaigns'

export class CampaignsService {
  constructor(
    private repo: CampaignsRepository,
    private lotsRepo: LotsRepository,
  ) {}

  async getByLot(lotId: string, tenantId: string) {
    const lot = await this.lotsRepo.findByIdAndTenant(lotId, tenantId)
    if (!lot) throw new Error('Lote no encontrado')
    return this.repo.findByLot(lotId)
  }

  async getById(id: string, tenantId: string) {
    const campaign = await this.repo.findByIdAndTenant(id, tenantId)
    if (!campaign) throw new Error('Campaña no encontrada')
    return campaign
  }

  async create(lotId: string, tenantId: string, input: CreateCampaignInput) {
    const lot = await this.lotsRepo.findByIdAndTenant(lotId, tenantId)
    if (!lot) throw new Error('Lote no encontrado')
    return this.repo.create(lotId, input)
  }

  async update(id: string, tenantId: string, input: UpdateCampaignInput) {
    const campaign = await this.repo.findByIdAndTenant(id, tenantId)
    if (!campaign) throw new Error('Campaña no encontrada')
    const updated = await this.repo.update(id, input)
    if (!updated) throw new Error('Campaña no encontrada')
    return updated
  }

  async close(id: string, tenantId: string, resultInput: CampaignResultInput) {
    const campaign = await this.repo.findByIdAndTenant(id, tenantId)
    if (!campaign) throw new Error('Campaña no encontrada')
    if (campaign.status === 'closed') throw new Error('La campaña ya está cerrada')
    await this.repo.update(id, { status: 'closed' })
    return this.repo.createResult(id, resultInput)
  }
}
