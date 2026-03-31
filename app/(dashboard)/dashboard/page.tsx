'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, type ReportSummary, type Field } from '@/lib/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
  LineChart, Line, ResponsiveContainer,
} from 'recharts'

const STATUS_LABELS: Record<string, string> = { pending: 'Pendiente', done: 'Completada', skipped: 'Omitida' }
const STATUS_COLORS: Record<string, string> = { pending: '#D4AC0D', done: '#0E6251', skipped: '#94A3B8' }
const CATEGORY_COLORS = ['#0E6251', '#3b82f6', '#D4AC0D', '#8b5cf6', '#f97316', '#64748B']

const TOOLTIP_STYLE = {
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 10,
  fontSize: 12,
  color: '#1A1A1A',
}

export default function DashboardPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [fieldId, setFieldId] = useState('')
  const [crop, setCrop] = useState('')

  const load = useCallback(async (filters?: { dateFrom?: string; dateTo?: string; fieldId?: string; crop?: string }) => {
    try {
      const [sum, fs] = await Promise.all([api.reports.summary(filters), api.fields.list()])
      setSummary(sum)
      setFields(fs)
    } catch {
      router.replace('/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { load() }, [load])

  function applyFilters() {
    setLoading(true)
    load({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, fieldId: fieldId || undefined, crop: crop || undefined })
  }

  function clearFilters() {
    setDateFrom(''); setDateTo(''); setFieldId(''); setCrop('')
    setLoading(true)
    load()
  }

  async function handleExport(format: 'excel' | 'pdf') {
    setExporting(true); setExportError(null)
    try {
      await api.reports.download({
        format,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        fieldId: fieldId || undefined,
        crop: crop || undefined,
      })
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Error al exportar')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <p className="text-muted text-center mt-16">Cargando...</p>
  if (!summary) return null

  const { kpis, activitiesByStatus, campaignsByCrop, stockByCategory, campaignYields } = summary

  const kpiCards = [
    { label: 'Establecimientos', value: kpis.totalFields, href: '/dashboard/fields' },
    { label: 'Lotes', value: kpis.totalLots, href: '/dashboard/lots' },
    { label: 'Campañas activas', value: kpis.activeCampaigns, href: '/dashboard/campaigns' },
    { label: 'Actividades pendientes', value: kpis.pendingActivities, href: '/dashboard/activities', warn: kpis.pendingActivities > 0 },
    { label: 'Alertas stock', value: kpis.stockAlerts, href: '/dashboard/stock', alert: kpis.stockAlerts > 0 },
  ]

  const actChartData = activitiesByStatus.map(r => ({
    name: STATUS_LABELS[r.status] ?? r.status,
    value: r.count,
    fill: STATUS_COLORS[r.status] ?? '#94A3B8',
  }))
  const yieldData = campaignYields.map((y, i) => ({
    name: `${y.crop}${y.variety ? ` (${y.variety})` : ''} #${i + 1}`,
    rendimiento: Number(y.yieldAmount),
    unidad: y.yieldUnit,
  }))

  const inputClass = "bg-white border border-rim rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand transition-colors"
  const cardClass = "bg-card border border-rim rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"

  return (
    <div className="space-y-6">
      {/* Header + Export */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-ink font-bold text-2xl">Inicio</h1>
        <div className="flex gap-2">
          <button disabled={exporting} onClick={() => handleExport('excel')}
            className="bg-card hover:bg-rim-subtle disabled:opacity-50 text-muted hover:text-ink border border-rim text-sm px-3 py-2 rounded-xl transition-colors"
          >
            {exporting ? '...' : '↓ Excel'}
          </button>
          <button disabled={exporting} onClick={() => handleExport('pdf')}
            className="bg-card hover:bg-rim-subtle disabled:opacity-50 text-muted hover:text-ink border border-rim text-sm px-3 py-2 rounded-xl transition-colors"
          >
            {exporting ? '...' : '↓ PDF'}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-xs text-muted block mb-1">Desde</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Hasta</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Establecimiento</label>
          <select value={fieldId} onChange={e => setFieldId(e.target.value)} className={inputClass}>
            <option value="">Todos</option>
            {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Cultivo</label>
          <input value={crop} onChange={e => setCrop(e.target.value)} placeholder="ej: Soja"
            className={`${inputClass} w-28`}
          />
        </div>
        <button onClick={applyFilters}
          className="bg-brand hover:bg-brand-hover text-white text-sm px-4 py-2 rounded-xl transition-colors"
        >
          Aplicar
        </button>
        {(dateFrom || dateTo || fieldId || crop) && (
          <button onClick={clearFilters} className="text-muted hover:text-ink text-sm px-3 py-2">
            Limpiar
          </button>
        )}
      </div>
      {exportError && <p className="text-danger text-sm">{exportError}</p>}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpiCards.map(card => (
          <Link key={card.label} href={card.href}
            className={`bg-card border rounded-2xl p-4 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 ${
              card.alert ? 'border-danger/30' : 'border-rim'
            }`}
          >
            <p className={`font-display text-3xl font-bold ${card.alert ? 'text-danger' : card.warn ? 'text-accent' : 'text-brand'}`}>
              {card.value}
            </p>
            <p className="text-xs text-muted mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Actividades por estado */}
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-ink mb-4">Actividades por estado</h2>
          {actChartData.length === 0 ? (
            <p className="text-subtle text-sm text-center py-8">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={actChartData} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#F3F4F6' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {actChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Campañas por cultivo */}
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-ink mb-4">Campañas por cultivo</h2>
          {campaignsByCrop.length === 0 ? (
            <p className="text-subtle text-sm text-center py-8">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={campaignsByCrop} dataKey="count" nameKey="crop" cx="50%" cy="50%" outerRadius={70}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={(props: any) => `${props.crop} (${props.count})`} labelLine={false}
                >
                  {campaignsByCrop.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stock por categoría */}
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-ink mb-4">Stock por categoría</h2>
          {stockByCategory.length === 0 ? (
            <p className="text-subtle text-sm text-center py-8">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stockByCategory} margin={{ left: 0, right: 10, top: 0, bottom: 20 }}>
                <XAxis dataKey="category" tick={{ fill: '#64748B', fontSize: 10 }} angle={-25} textAnchor="end" axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#F3F4F6' }}
                  formatter={(v) => [v, 'Cantidad total']}
                />
                <Bar dataKey="totalQuantity" fill="#0E6251" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Rendimiento campañas cerradas */}
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-ink mb-4">Rendimiento campañas cerradas</h2>
          {yieldData.length === 0 ? (
            <p className="text-subtle text-sm text-center py-8">Sin campañas cerradas con rendimiento</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={yieldData} margin={{ left: 0, right: 10, top: 0, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 9 }} angle={-20} textAnchor="end" axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE}
                  formatter={(v, _, p) => [`${v} ${p?.payload?.unidad ?? ''}`, 'Rendimiento']}
                />
                <Line type="monotone" dataKey="rendimiento" stroke="#0E6251" strokeWidth={2.5} dot={{ fill: '#0E6251', r: 4, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Alertas activas */}
      {kpis.stockAlerts > 0 && (
        <div className="bg-danger-light border border-danger/20 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-danger mb-1">Alertas activas</h2>
          <p className="text-sm text-muted">
            Hay <span className="text-danger font-semibold">{kpis.stockAlerts}</span> ítem{kpis.stockAlerts > 1 ? 's' : ''} de stock por debajo del umbral.{' '}
            <Link href="/dashboard/stock" className="text-danger underline">Ver stock →</Link>
          </p>
        </div>
      )}
    </div>
  )
}
