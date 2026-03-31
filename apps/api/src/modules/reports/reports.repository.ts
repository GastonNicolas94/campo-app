import { eq, and, sql, gte, lte, isNotNull } from 'drizzle-orm'
import {
  fields, lots, campaigns, campaignResults,
  activities, stockItems,
} from '@campo-app/db'
import type { Db } from '../../shared/db'

export interface ReportFilters {
  dateFrom?: string
  dateTo?: string
  fieldId?: string
  lotId?: string
  crop?: string
  stockCategory?: string
}

export class ReportsRepository {
  constructor(private db: Db) {}

  async getKpis(tenantId: string, filters: ReportFilters) {
    const fieldFilter = and(
      eq(fields.tenantId, tenantId),
      filters.fieldId ? eq(fields.id, filters.fieldId) : undefined,
    )

    const [
      [fResult], [lResult], [cResult], [aResult], [sResult]
    ] = await Promise.all([
      this.db.select({ count: sql<number>`cast(count(*) as integer)` }).from(fields).where(fieldFilter),
      this.db.select({ count: sql<number>`cast(count(*) as integer)` }).from(lots).innerJoin(fields, eq(lots.fieldId, fields.id)).where(and(fieldFilter, filters.lotId ? eq(lots.id, filters.lotId) : undefined)),
      this.db.select({ count: sql<number>`cast(count(*) as integer)` }).from(campaigns).innerJoin(lots, eq(campaigns.lotId, lots.id)).innerJoin(fields, eq(lots.fieldId, fields.id)).where(and(fieldFilter, eq(campaigns.status, 'active'))),
      this.db.select({ count: sql<number>`cast(count(*) as integer)` }).from(activities).innerJoin(lots, eq(activities.lotId, lots.id)).innerJoin(fields, eq(lots.fieldId, fields.id)).where(and(fieldFilter, eq(activities.status, 'pending'))),
      this.db.select({ count: sql<number>`cast(count(*) as integer)` }).from(stockItems).innerJoin(fields, eq(stockItems.fieldId, fields.id)).where(and(fieldFilter, isNotNull(stockItems.alertThreshold), sql`${stockItems.currentQuantity} <= ${stockItems.alertThreshold}`)),
    ])

    return {
      totalFields: fResult?.count ?? 0,
      totalLots: lResult?.count ?? 0,
      activeCampaigns: cResult?.count ?? 0,
      pendingActivities: aResult?.count ?? 0,
      stockAlerts: sResult?.count ?? 0,
    }
  }

  async getActivitiesByStatus(tenantId: string, filters: ReportFilters) {
    return this.db
      .select({
        status: activities.status,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(activities)
      .innerJoin(lots, eq(activities.lotId, lots.id))
      .innerJoin(fields, eq(lots.fieldId, fields.id))
      .where(and(
        eq(fields.tenantId, tenantId),
        filters.fieldId ? eq(fields.id, filters.fieldId) : undefined,
        filters.lotId ? eq(lots.id, filters.lotId) : undefined,
        filters.dateFrom ? gte(activities.dueDate, filters.dateFrom) : undefined,
        filters.dateTo ? lte(activities.dueDate, filters.dateTo) : undefined,
      ))
      .groupBy(activities.status)
  }

  async getCampaignsByCrop(tenantId: string, filters: ReportFilters) {
    return this.db
      .select({
        crop: campaigns.crop,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(campaigns)
      .innerJoin(lots, eq(campaigns.lotId, lots.id))
      .innerJoin(fields, eq(lots.fieldId, fields.id))
      .where(and(
        eq(fields.tenantId, tenantId),
        filters.fieldId ? eq(fields.id, filters.fieldId) : undefined,
        filters.lotId ? eq(lots.id, filters.lotId) : undefined,
        filters.crop ? eq(campaigns.crop, filters.crop) : undefined,
        filters.dateFrom ? gte(campaigns.sowingDate, filters.dateFrom) : undefined,
        filters.dateTo ? lte(campaigns.sowingDate, filters.dateTo) : undefined,
      ))
      .groupBy(campaigns.crop)
  }

  async getStockByCategory(tenantId: string, filters: ReportFilters) {
    return this.db
      .select({
        category: stockItems.category,
        totalQuantity: sql<number>`cast(sum(${stockItems.currentQuantity}) as float)`,
        itemCount: sql<number>`cast(count(*) as integer)`,
      })
      .from(stockItems)
      .innerJoin(fields, eq(stockItems.fieldId, fields.id))
      .where(and(
        eq(fields.tenantId, tenantId),
        filters.fieldId ? eq(fields.id, filters.fieldId) : undefined,
        filters.stockCategory
          ? eq(stockItems.category, filters.stockCategory as 'agroquimico' | 'semilla' | 'combustible' | 'fertilizante' | 'repuesto' | 'otro')
          : undefined,
      ))
      .groupBy(stockItems.category)
  }

  async getCampaignYields(tenantId: string, filters: ReportFilters) {
    return this.db
      .select({
        crop: campaigns.crop,
        variety: campaigns.variety,
        yieldAmount: campaignResults.yieldAmount,
        yieldUnit: campaignResults.yieldUnit,
        harvestDate: campaigns.harvestDate,
      })
      .from(campaigns)
      .innerJoin(lots, eq(campaigns.lotId, lots.id))
      .innerJoin(fields, eq(lots.fieldId, fields.id))
      .innerJoin(campaignResults, eq(campaignResults.campaignId, campaigns.id))
      .where(and(
        eq(fields.tenantId, tenantId),
        eq(campaigns.status, 'closed'),
        isNotNull(campaignResults.yieldAmount),
        filters.fieldId ? eq(fields.id, filters.fieldId) : undefined,
        filters.crop ? eq(campaigns.crop, filters.crop) : undefined,
        filters.dateFrom ? gte(campaigns.harvestDate, filters.dateFrom) : undefined,
        filters.dateTo ? lte(campaigns.harvestDate, filters.dateTo) : undefined,
      ))
  }

  async getAllCampaigns(tenantId: string, filters: ReportFilters) {
    return this.db
      .select({
        id: campaigns.id,
        lotName: lots.name,
        fieldName: fields.name,
        crop: campaigns.crop,
        variety: campaigns.variety,
        sowingDate: campaigns.sowingDate,
        harvestDate: campaigns.harvestDate,
        status: campaigns.status,
        yieldAmount: campaignResults.yieldAmount,
        yieldUnit: campaignResults.yieldUnit,
      })
      .from(campaigns)
      .innerJoin(lots, eq(campaigns.lotId, lots.id))
      .innerJoin(fields, eq(lots.fieldId, fields.id))
      .leftJoin(campaignResults, eq(campaignResults.campaignId, campaigns.id))
      .where(and(
        eq(fields.tenantId, tenantId),
        filters.fieldId ? eq(fields.id, filters.fieldId) : undefined,
        filters.lotId ? eq(lots.id, filters.lotId) : undefined,
        filters.crop ? eq(campaigns.crop, filters.crop) : undefined,
        filters.dateFrom ? gte(campaigns.sowingDate, filters.dateFrom) : undefined,
        filters.dateTo ? lte(campaigns.sowingDate, filters.dateTo) : undefined,
      ))
  }

  async getAllActivities(tenantId: string, filters: ReportFilters) {
    return this.db
      .select({
        id: activities.id,
        title: activities.title,
        status: activities.status,
        lotName: lots.name,
        campaignId: activities.campaignId,
        dueDate: activities.dueDate,
        completedAt: activities.completedAt,
      })
      .from(activities)
      .innerJoin(lots, eq(activities.lotId, lots.id))
      .innerJoin(fields, eq(lots.fieldId, fields.id))
      .where(and(
        eq(fields.tenantId, tenantId),
        filters.fieldId ? eq(fields.id, filters.fieldId) : undefined,
        filters.lotId ? eq(lots.id, filters.lotId) : undefined,
        filters.dateFrom ? gte(activities.dueDate, filters.dateFrom) : undefined,
        filters.dateTo ? lte(activities.dueDate, filters.dateTo) : undefined,
      ))
  }

  async getAllStockItems(tenantId: string, filters: ReportFilters) {
    return this.db
      .select({
        id: stockItems.id,
        fieldName: fields.name,
        name: stockItems.name,
        category: stockItems.category,
        unit: stockItems.unit,
        currentQuantity: stockItems.currentQuantity,
        alertThreshold: stockItems.alertThreshold,
      })
      .from(stockItems)
      .innerJoin(fields, eq(stockItems.fieldId, fields.id))
      .where(and(
        eq(fields.tenantId, tenantId),
        filters.fieldId ? eq(fields.id, filters.fieldId) : undefined,
        filters.stockCategory
          ? eq(stockItems.category, filters.stockCategory as 'agroquimico' | 'semilla' | 'combustible' | 'fertilizante' | 'repuesto' | 'otro')
          : undefined,
      ))
  }
}
