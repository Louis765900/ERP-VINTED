'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingCart, Users, Truck,
  BarChart3, UserCog, ScrollText, Settings, LogOut, ChevronRight,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SessionUser } from '@/lib/auth'

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  roles?: string[]
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/stock', icon: Package, label: 'Stock' },
  { href: '/ventes', icon: ShoppingCart, label: 'Ventes' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/fournisseurs', icon: Truck, label: 'Fournisseurs' },
  { href: '/finance', icon: TrendingUp, label: 'Finance', roles: ['PATRON', 'GESTIONNAIRE'] },
  { href: '/utilisateurs', icon: UserCog, label: 'Utilisateurs', roles: ['PATRON'] },
  { href: '/logs', icon: ScrollText, label: 'Audit', roles: ['PATRON', 'GESTIONNAIRE'] },
]

interface SidebarProps {
  user: SessionUser
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = navItems.filter(
    item => !item.roles || item.roles.includes(user.role)
  )

  return (
    <aside className="flex h-screen w-60 flex-col bg-gray-950 border-r border-gray-800">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-gray-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-md">
          <BarChart3 className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">TOM ERP</p>
          <p className="text-[10px] text-gray-500">v2.0 Pro</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {visibleItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100 border border-transparent'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-indigo-400' : 'text-gray-500')} />
              <span>{label}</span>
              {active && <ChevronRight className="ml-auto h-3 w-3 text-indigo-400" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: user.color }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-100 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate capitalize">{user.role.toLowerCase()}</p>
          </div>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Déconnexion</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
