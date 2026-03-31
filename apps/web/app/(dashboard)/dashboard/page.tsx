'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, type ReportSummary, type Field } from '@/lib/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
  LineChart, Line, ResponsiveContainer,
} from 'recharts'

const STATUS_LABELS: Record<string, string> = { pending: 'Pendiente', done: 'Completada', skipped: 'Omitida' }
const STATUS_COLORS: Record<string, string> = { pending: '#eab308', done: '#22c55e', skipped: '#71717a' }
const CATEGORY_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#a78bfa', '#f97316', '#6b7280']

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

  async function load(filters?: { dateFrom?: string; dateTo?: string; fieldId?: string; crop?: string }) {
    try {
      const [sum, fs] = await Promise.all([api.reports.summary(filters), api.fields.list()])
      setSummary(sum)
      setFields(fs)
    } catch {
      router.replace('/login')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

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

  if (loading) return <p className="text-zinc-400 text-center mt-16">Cargando...</p>
  if (!summary) return null

  const { kpis, activitiesByStatus, campaignsByCrop, stockByCategory, campaignYields } = summary

  const kpiCards = [
    { label: 'Establecimientos', value: kpis.totalFields, color: 'text-blue-400', href: '/dashboard/fields' },
    { label: 'Lotes', value: kpis.totalLots, color: 'text-indigo-400', href: '/dashboard/lots' },
    { label: 'Campañas activas', value: kpis.activeCampaigns, color: 'text-green-400', href: '/dashboard/campaigns' },
    { label: 'Actividades pendientes', value: kpis.pendingActivities, color: 'text-yellow-400', href: '/dashboard/activities' },
    { label: 'Alertas stock', value: kpis.stockAlerts, color: kpis.stockAlerts > 0 ? 'text-red-400' : 'text-zinc-400', href: '/dashboard/stock' },
  ]

  const actChartData = activitiesByStatus.map(r => ({
    name: STATUS_LABELS[r.status] ?? r.status,
    value: r.count,
    fill: STATUS_COLORS[r.status] ?? '#71717a',
  }))
  const yieldData = campaignYields.map((y, i) => ({
    name: `${y.crop}${y.variety ? ` (${y.variety})` : ''} #${i + 1}`,
    rendimiento: Number(y.yieldAmount),
    unidad: y.yieldUnit,
  }))

  return (
    <div className="space-y-6">
      {/* Header + Export */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Inicio</h1>
        <div className="flex gap-2">
          <button disabled={exporting} onClick={() => handleExport('excel')}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg"
          >
            {exporting ? '...' : '↓ Excel'}
          </button>
          <button disabled={exporting} onClick={() => handleExport('pdf')}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg"
          >
            {exporting ? '...' : '↓ PDF'}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Desde</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Hasta</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Establecimiento</label>
          <select value={fieldId} onChange={e => setFieldId(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
          >
            <option value="">Todos</option>
            {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Cultivo</label>
          <input value={crop} onChange={e => setCrop(e.target.value)} placeholder="ej: Soja"
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none w-28"
          />
        </div>
        <button onClick={applyFilters}
          className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1.5 rounded-lg"
        >
          Aplicar
        </button>
        {(dateFrom || dateTo || fieldId || crop) && (
          <button onClick={clearFilters} className="text-zinc-400 hover:text-zinc-200 text-sm px-3 py-1.5">
            Limpiar
          </button>
        )}
      </div>
      {exportError && <p className="text-red-400 text-sm">{exportError}</p>}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpiCards.map(card => (
          <a key={card.label} href={card.href}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 transition-colors"
          >
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-zinc-400 mt-1">{card.label}</p>
          </a>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Actividades por estado */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-sm font-medium text-zinc-300 mb-3">Actividades por estado</h2>
          {actChartData.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={actChartData} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {actChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Campañas por cultivo */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-sm font-medium text-zinc-300 mb-3">Campañas por cultivo</h2>
          {campaignsByCrop.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">Sin datos</p>
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
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stock por categoría */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-sm font-medium text-zinc-300 mb-3">Stock por categoría</h2>
          {stockByCategory.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stockByCategory} margin={{ left: 0, right: 10, top: 0, bottom: 20 }}>
                <XAxis dataKey="category" tick={{ fill: '#a1a1aa', fontSize: 10 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                  formatter={(v) => [v, 'Cantidad total']}
                />
                <Bar dataKey="totalQuantity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Rendimiento campañas cerradas */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-sm font-medium text-zinc-300 mb-3">Rendimiento campañas cerradas</h2>
          {yieldData.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">Sin campañas cerradas con rendimiento</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={yieldData} margin={{ left: 0, right: 10, top: 0, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 9 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                  formatter={(v, _, p) => [`${v} ${p?.payload?.unidad ?? ''}`, 'Rendimiento']}
                />
                <Line type="monotone" dataKey="rendimiento" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Alertas activas */}
      {kpis.stockAlerts > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <h2 className="text-sm font-medium text-red-400 mb-1">Alertas activas</h2>
          <p className="text-sm text-zinc-400">
            Hay <span className="text-red-400 font-medium">{kpis.stockAlerts}</span> ítem{kpis.stockAlerts > 1 ? 's' : ''} de stock por debajo del umbral.{' '}
            <a href="/dashboard/stock" className="text-red-400 underline">Ver stock →</a>
          </p>
        </div>
      )}
    </div>
  )
}
