import { Hono } from 'hono'
import { ReportsRepository } from './reports.repository'
import { ReportsService } from './reports.service'
import { verifyAuth } from '../../shared/middleware/auth.middleware'
import { db } from '../../shared/db'

export function createReportsRouter() {
  const router = new Hono()
  const service = new ReportsService(new ReportsRepository(db))

  router.use('*', verifyAuth)

  router.get('/summary', async (c) => {
    const { tenantId } = c.get('user')
    const { dateFrom, dateTo, fieldId, lotId, crop, stockCategory } = c.req.query()
    const filters = { dateFrom, dateTo, fieldId, lotId, crop, stockCategory }
    const data = await service.getSummary(tenantId, filters)
    return c.json({ data })
  })

  router.get('/export', async (c) => {
    try {
      const VALID_MODULES = ['campaigns', 'activities', 'stock']
      const { tenantId } = c.get('user')
      const { format = 'excel', dateFrom, dateTo, fieldId, lotId, crop, stockCategory, modules = 'campaigns,activities,stock' } = c.req.query()
      const filters = { dateFrom, dateTo, fieldId, lotId, crop, stockCategory }
      const moduleList = modules.split(',').map(m => m.trim()).filter(m => VALID_MODULES.includes(m))

      if (moduleList.length === 0) {
        return c.json({ error: 'Módulos inválidos' }, 400)
      }

      const date = new Date().toISOString().split('T')[0]

      if (format === 'pdf') {
        const buffer = await service.generatePdf(tenantId, filters, moduleList)
        return new Response(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=reporte-campo-${date}.pdf`,
          },
        })
      }

      const buffer = await service.generateExcel(tenantId, filters, moduleList)
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename=reporte-campo-${date}.xlsx`,
        },
      })
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Error al generar reporte' }, 500)
    }
  })

  return router
}
