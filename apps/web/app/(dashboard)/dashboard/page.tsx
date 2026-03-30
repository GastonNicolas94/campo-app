'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ fields: 0, activities: 0 })
  const [user, setUser] = useState<{ email: string; role: string } | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const me = await api.auth.me()
        setUser(me)
        const [fields, activities] = await Promise.all([
          api.fields.list(),
          api.activities.list(),
        ])
        setStats({ fields: fields.length, activities: activities.filter(a => a.status === 'pending').length })
      } catch {
        router.replace('/login')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  if (loading) return <p className="text-zinc-400 text-center mt-16">Cargando...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bienvenido{user ? `, ${user.email}` : ''}</h1>
        <p className="text-zinc-400 text-sm mt-1 capitalize">{user?.role}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Link href="/dashboard/fields" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors">
          <p className="text-3xl font-bold text-green-400">{stats.fields}</p>
          <p className="text-sm text-zinc-400 mt-1">Establecimientos</p>
        </Link>
        <Link href="/dashboard/activities" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors">
          <p className="text-3xl font-bold text-yellow-400">{stats.activities}</p>
          <p className="text-sm text-zinc-400 mt-1">Actividades pendientes</p>
        </Link>
      </div>
    </div>
  )
}
