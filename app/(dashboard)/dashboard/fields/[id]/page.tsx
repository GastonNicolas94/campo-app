'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api, type Field, type Lot } from '@/lib/api'
import Link from 'next/link'

const inputClass = "w-full bg-surface border border-rim rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-brand transition-colors"

export default function FieldDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [field, setField] = useState<Field | null>(null)
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [lotName, setLotName] = useState('')
  const [lotHectares, setLotHectares] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const [f, ls] = await Promise.all([api.fields.getById(id), api.fields.lots(id)])
      setField(f); setLots(ls)
    } catch {
      router.replace('/dashboard/fields')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleCreateLot(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      await api.fields.createLot(id, { name: lotName, hectares: lotHectares || undefined })
      setLotName(''); setLotHectares(''); setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-muted text-center mt-16">Cargando...</p>
  if (!field) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted hover:text-ink text-sm transition-colors">←</button>
        <div>
          <h1 className="font-display text-ink font-bold text-2xl">{field.name}</h1>
          {field.location && <p className="text-sm text-muted mt-0.5">{field.location}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">Lotes ({lots.length})</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-brand hover:bg-brand-hover text-white text-sm px-4 py-2.5 rounded-xl transition-colors font-medium"
        >
          + Lote
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateLot} className="bg-card border border-rim rounded-2xl p-5 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <input value={lotName} onChange={e => setLotName(e.target.value)}
            placeholder="Nombre del lote *" required className={inputClass}
          />
          <input value={lotHectares} onChange={e => setLotHectares(e.target.value)}
            placeholder="Hectáreas (opcional)" type="number" step="0.01" className={inputClass}
          />
          {error && <p className="text-danger text-sm">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-muted hover:text-ink text-sm px-4 py-2.5"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {lots.length === 0 ? (
        <p className="text-subtle text-sm text-center mt-8">No hay lotes. Creá uno.</p>
      ) : (
        <ul className="space-y-2">
          {lots.map(lot => (
            <li key={lot.id}>
              <Link href={`/dashboard/lots/${lot.id}`}
                className="block bg-card border border-rim hover:border-brand/30 hover:shadow-[0_4px_16px_rgba(14,98,81,0.08)] rounded-2xl p-4 transition-all"
              >
                <p className="font-semibold text-ink">{lot.name}</p>
                {lot.hectares && <p className="text-sm text-muted mt-0.5">{lot.hectares} ha</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
