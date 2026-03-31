import type { StockRepository } from './stock.repository'
import type { CreateStockItemInput, UpdateStockItemInput, CreateMovementInput } from '@campo-app/validators/stock'

export class StockService {
  constructor(private repo: StockRepository) {}

  async listByTenant(tenantId: string) {
    return this.repo.findByTenant(tenantId)
  }

  async listByField(fieldId: string, tenantId: string) {
    return this.repo.findByField(fieldId, tenantId)
  }

  async getById(id: string, tenantId: string) {
    const item = await this.repo.findByIdAndTenant(id, tenantId)
    if (!item) throw new Error('Item no encontrado')
    return item
  }

  async create(input: CreateStockItemInput) {
    return this.repo.create(input)
  }

  async update(id: string, tenantId: string, input: UpdateStockItemInput) {
    await this.getById(id, tenantId)
    const updated = await this.repo.update(id, input)
    if (!updated) throw new Error('Item no encontrado')
    return updated
  }

  async delete(id: string, tenantId: string) {
    await this.getById(id, tenantId)
    const deleted = await this.repo.delete(id)
    if (!deleted) throw new Error('Item no encontrado')
    return deleted
  }

  async addMovement(itemId: string, tenantId: string, input: CreateMovementInput, userId?: string) {
    const item = await this.getById(itemId, tenantId)
    const current = Number(item.currentQuantity)
    const qty = input.quantity
    const newQty = input.type === 'in' ? current + qty : current - qty
    if (newQty < 0) throw new Error('Stock insuficiente para registrar la salida')

    const movement = await this.repo.createMovement(itemId, input, userId)
    const updated = await this.repo.updateQuantity(itemId, newQty)

    const alert = updated?.alertThreshold != null && newQty <= Number(updated.alertThreshold)

    return { movement, item: updated, alert }
  }

  async getMovements(itemId: string, tenantId: string) {
    await this.getById(itemId, tenantId)
    return this.repo.findMovements(itemId)
  }

  async getAlerts(tenantId: string) {
    return this.repo.findAlerts(tenantId)
  }
}
