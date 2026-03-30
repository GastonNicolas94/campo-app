'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; role: string } | null>(null)

  useEffect(() => {
    api.auth.me()
      .then(setUser)
      .catch(() => router.push('/login'))
  }, [router])

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        Cargando...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="text-2xl font-semibold mb-2">Bienvenido</h1>
      <p className="text-zinc-400">{user.email} — {user.role}</p>
    </main>
  )
}
