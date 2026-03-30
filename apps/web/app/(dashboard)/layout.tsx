'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/dashboard/fields', label: 'Establecimientos' },
  { href: '/dashboard/activities', label: 'Actividades' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) router.replace('/login')
  }, [router])

  function logout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    router.replace('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex">
      <aside className="hidden md:flex flex-col w-56 border-r border-zinc-800 p-4 gap-1">
        <div className="mb-6 px-2">
          <span className="text-green-400 font-bold text-lg">Campo App</span>
        </div>
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === item.href
                ? 'bg-zinc-800 text-white font-medium'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            {item.label}
          </Link>
        ))}
        <div className="mt-auto">
          <button onClick={logout} className="w-full px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 text-left">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="md:hidden border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <span className="text-green-400 font-bold">Campo App</span>
          <button onClick={logout} className="text-sm text-zinc-500">Salir</button>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto">{children}</main>

        <nav className="md:hidden border-t border-zinc-800 flex">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 py-3 text-xs text-center transition-colors ${
                pathname === item.href ? 'text-green-400' : 'text-zinc-500'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
