import * as React from 'react'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  DISPONIBLE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  RESERVE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PUBLIE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  A_EXPEDIER: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  EN_LIVRAISON: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  LIVRE: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  VENDU: 'bg-green-500/10 text-green-400 border-green-500/20',
  ARCHIVE: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  PATRON: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  VENDEUR: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  GESTIONNAIRE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

const statusLabels: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  RESERVE: 'Réservé',
  PUBLIE: 'Publié',
  A_EXPEDIER: 'À expédier',
  EN_LIVRAISON: 'En livraison',
  LIVRE: 'Livré',
  VENDU: 'Vendu',
  ARCHIVE: 'Archivé',
  PATRON: 'Patron',
  VENDEUR: 'Vendeur',
  GESTIONNAIRE: 'Gestionnaire',
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: string
  variant?: 'default' | 'outline'
}

export function Badge({ status, variant = 'default', className, children, ...props }: BadgeProps) {
  const colorClass = status ? statusColors[status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : ''
  const label = status ? statusLabels[status] ?? status : children

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className
      )}
      {...props}
    >
      {label}
    </span>
  )
}
