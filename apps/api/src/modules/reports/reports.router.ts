import { Hono } from 'hono'
import { z } from 'zod'
import { ReportsRepository } from './reports.repository'
import { ReportsService } from './reports.service'
import { verifyAuth } from '../../shared/middleware/auth.middleware'
import { db } from '../../shared/db'

const STOCK_CATEGORIES = ['agroquimico', 'semilla', 'combustible', 'fertilizante', 'repuesto', 'outro'] as const

const reportFiltersSchema = z.object({
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  fieldId: z.string().uuid().optional(),
  lotId: z.string().uuid().optional(),
  crop: z.string().optional(),
  stockCategory: z.enum(STOCK_CATEGORIES).optional(),
})

export function createReportsRouter() {
  const router = new Hono()
  const service = new ReportsService(new ReportsRepository(db))

  router.use('*', verifyAuth)

  router.get('/summary', async (c) => {
    try {
      const { tenantId } = c.get('user')
      const parsed = reportFiltersSchema.safeParse(c.req.query())
      if (!parsed.success) {
        return c.json({ error: 'Parámetros inválidos' }, 400)
      }
      const filters = parsed.data
      const data = await service.getSummary(tenantId, filters)
      return c.json({ data })
    } catch (err) {
      return c.json({ error: 'Error al obtener resumen' }, 500)
    }
  })

  router.get('/export', async (c) => {
    try {
      const VALID_MODULES = ['campaigns', 'activities', 'stock']
      const { tenantId } = c.get('user')
      const { format = 'excel', modules = 'campaigns,activities,stock', ...rawFilters } = c.req.query()

      const parsed = reportFiltersSchema.safeParse(rawFilters)
      if (!parsed.success) {
        return c.json({ error: 'Parámetros inválidos' }, 400)
      }
      const filters = parsed.data

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
