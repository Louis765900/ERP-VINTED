'use client'
import { Bell, Search } from 'lucide-react'
import type { SessionUser } from '@/lib/auth'

interface TopbarProps {
  user: SessionUser
  title: string
  subtitle?: string
}

export function Topbar({ user, title, subtitle }: TopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950 px-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-100">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Recherche globale..."
            className="h-8 w-64 rounded-lg border border-gray-700 bg-gray-800 pl-9 pr-3 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-500" />
        </button>
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer"
          style={{ backgroundColor: user.color }}
          title={user.name}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
