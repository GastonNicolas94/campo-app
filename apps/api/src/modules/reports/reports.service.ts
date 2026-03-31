import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import type { ReportsRepository, ReportFilters } from './reports.repository'

export class ReportsService {
  constructor(private repo: ReportsRepository) {}

  async getSummary(tenantId: string, filters: ReportFilters) {
    const [kpis, activitiesByStatus, campaignsByCrop, stockByCategory, campaignYields] = await Promise.all([
      this.repo.getKpis(tenantId, filters),
      this.repo.getActivitiesByStatus(tenantId, filters),
      this.repo.getCampaignsByCrop(tenantId, filters),
      this.repo.getStockByCategory(tenantId, filters),
      this.repo.getCampaignYields(tenantId, filters),
    ])
    return { kpis, activitiesByStatus, campaignsByCrop, stockByCategory, campaignYields }
  }

  async generateExcel(tenantId: string, filters: ReportFilters, modules: string[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Campo App'
    wb.created = new Date()

    const summary = wb.addWorksheet('Resumen')
    summary.columns = [{ header: 'KPI', key: 'kpi', width: 30 }, { header: 'Valor', key: 'valor', width: 15 }]
    const kpis = await this.repo.getKpis(tenantId, filters)
    summary.addRows([
      { kpi: 'Establecimientos', valor: kpis.totalFields },
      { kpi: 'Lotes', valor: kpis.totalLots },
      { kpi: 'Campañas activas', valor: kpis.activeCampaigns },
      { kpi: 'Actividades pendientes', valor: kpis.pendingActivities },
      { kpi: 'Alertas de stock', valor: kpis.stockAlerts },
    ])
    summary.getRow(1).font = { bold: true }

    if (modules.includes('campaigns')) {
      const campRows = await this.repo.getAllCampaigns(tenantId, filters)
      const ws = wb.addWorksheet('Campañas')
      ws.columns = [
        { header: 'Establecimiento', key: 'fieldName', width: 20 },
        { header: 'Lote', key: 'lotName', width: 15 },
        { header: 'Cultivo', key: 'crop', width: 15 },
        { header: 'Variedad', key: 'variety', width: 15 },
        { header: 'Siembra', key: 'sowingDate', width: 12 },
        { header: 'Cosecha', key: 'harvestDate', width: 12 },
        { header: 'Estado', key: 'status', width: 10 },
        { header: 'Rendimiento', key: 'yieldAmount', width: 12 },
        { header: 'Unidad', key: 'yieldUnit', width: 10 },
      ]
      ws.addRows(campRows)
      ws.getRow(1).font = { bold: true }
    }

    if (modules.includes('activities')) {
      const actRows = await this.repo.getAllActivities(tenantId, filters)
      const ws = wb.addWorksheet('Actividades')
      ws.columns = [
        { header: 'Título', key: 'title', width: 30 },
        { header: 'Estado', key: 'status', width: 12 },
        { header: 'Lote', key: 'lotName', width: 15 },
        { header: 'Vencimiento', key: 'dueDate', width: 12 },
        { header: 'Completada', key: 'completedAt', width: 20 },
      ]
      ws.addRows(actRows)
      ws.getRow(1).font = { bold: true }
    }

    if (modules.includes('stock')) {
      const stockRows = await this.repo.getAllStockItems(tenantId, filters)
      const ws = wb.addWorksheet('Stock')
      ws.columns = [
        { header: 'Establecimiento', key: 'fieldName', width: 20 },
        { header: 'Nombre', key: 'name', width: 20 },
        { header: 'Categoría', key: 'category', width: 15 },
        { header: 'Unidad', key: 'unit', width: 10 },
        { header: 'Cantidad actual', key: 'currentQuantity', width: 15 },
        { header: 'Umbral alerta', key: 'alertThreshold', width: 14 },
      ]
      ws.addRows(stockRows)
      ws.getRow(1).font = { bold: true }
    }

    return Buffer.from(await wb.xlsx.writeBuffer())
  }

  async generatePdf(tenantId: string, filters: ReportFilters, modules: string[]): Promise<Buffer> {
    const [kpis, campRows, actRows, stockRows] = await Promise.all([
      this.repo.getKpis(tenantId, filters),
      modules.includes('campaigns') ? this.repo.getAllCampaigns(tenantId, filters) : Promise.resolve([]),
      modules.includes('activities') ? this.repo.getAllActivities(tenantId, filters) : Promise.resolve([]),
      modules.includes('stock') ? this.repo.getAllStockItems(tenantId, filters) : Promise.resolve([]),
    ])

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' })
      const chunks: Buffer[] = []
      doc.on('data', chunk => chunks.push(Buffer.from(chunk)))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const date = new Date().toLocaleDateString('es-AR')

      doc.fontSize(22).fillColor('#16a34a').text('Campo App', { align: 'center' })
      doc.fontSize(14).fillColor('#000').text('Reporte General', { align: 'center' })
      doc.fontSize(10).fillColor('#666').text(`Generado: ${date}`, { align: 'center' })
      doc.moveDown(2)

      doc.fontSize(16).fillColor('#000').text('Resumen General')
      doc.moveDown(0.5)
      doc.fontSize(11)
      ;[
        `Establecimientos: ${kpis.totalFields}`,
        `Lotes: ${kpis.totalLots}`,
        `Campañas activas: ${kpis.activeCampaigns}`,
        `Actividades pendientes: ${kpis.pendingActivities}`,
        `Alertas de stock: ${kpis.stockAlerts}`,
      ].forEach(line => doc.text(line))

      if (campRows.length > 0) {
        doc.addPage()
        doc.fontSize(16).text(`Campañas (${campRows.length})`)
        doc.moveDown(0.5)
        doc.fontSize(9)
        campRows.forEach(c => {
          doc.text(`${c.fieldName} / ${c.lotName} — ${c.crop}${c.variety ? ` (${c.variety})` : ''} — Siembra: ${c.sowingDate} — ${c.status}${c.yieldAmount ? ` — Rend: ${c.yieldAmount} ${c.yieldUnit}` : ''}`)
        })
      }

      if (actRows.length > 0) {
        doc.addPage()
        doc.fontSize(16).text(`Actividades (${actRows.length})`)
        doc.moveDown(0.5)
        doc.fontSize(9)
        actRows.forEach(a => {
          doc.text(`[${a.status.toUpperCase()}] ${a.title} — Lote: ${a.lotName}${a.dueDate ? ` — Vence: ${a.dueDate}` : ''}`)
        })
      }

      if (stockRows.length > 0) {
        doc.addPage()
        doc.fontSize(16).text(`Stock (${stockRows.length} ítems)`)
        doc.moveDown(0.5)
        doc.fontSize(9)
        stockRows.forEach(s => {
          const alert = s.alertThreshold != null && Number(s.currentQuantity) <= Number(s.alertThreshold) ? ' ⚠️' : ''
          doc.text(`${s.fieldName} — ${s.name} (${s.category}) — ${s.currentQuantity} ${s.unit}${alert}`)
        })
      }

      doc.end()
    })
  }
}
