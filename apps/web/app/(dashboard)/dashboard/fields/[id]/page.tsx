'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api, type Field, type Lot } from '@/lib/api'
import Link from 'next/link'

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

  if (loading) return <p className="text-zinc-400 text-center mt-16">Cargando...</p>
  if (!field) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-zinc-500 hover:text-zinc-300 text-sm">←</button>
        <div>
          <h1 className="text-xl font-semibold">{field.name}</h1>
          {field.location && <p className="text-sm text-zinc-400">{field.location}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-medium text-zinc-300">Lotes ({lots.length})</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-3 py-1.5 rounded-lg"
        >
          + Lote
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateLot} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <input value={lotName} onChange={e => setLotName(e.target.value)}
            placeholder="Nombre del lote *" required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
          />
          <input value={lotHectares} onChange={e => setLotHectares(e.target.value)}
            placeholder="Hectáreas (opcional)" type="number" step="0.01"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-zinc-400 hover:text-zinc-200 text-sm px-4 py-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {lots.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center mt-8">No hay lotes. Creá uno.</p>
      ) : (
        <ul className="space-y-2">
          {lots.map(lot => (
            <li key={lot.id}>
              <Link href={`/dashboard/lots/${lot.id}`}
                className="block bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition-colors"
              >
                <p className="font-medium">{lot.name}</p>
                {lot.hectares && <p className="text-sm text-zinc-400 mt-0.5">{lot.hectares} ha</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
