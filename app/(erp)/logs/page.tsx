import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import { ScrollText, User } from 'lucide-react'

const actionLabels: Record<string, { label: string; color: string }> = {
  LOGIN: { label: 'Connexion', color: 'text-blue-400' },
  PRODUCT_ADDED: { label: 'Produit ajouté', color: 'text-emerald-400' },
  PRODUCT_RESERVED: { label: 'Réservation', color: 'text-amber-400' },
  RESERVATION_CANCELLED: { label: 'Réservation annulée', color: 'text-red-400' },
  PRODUCT_PUBLISHED: { label: 'Publié sur Vinted', color: 'text-blue-400' },
  PRODUCT_SOLD: { label: 'Vendu', color: 'text-green-400' },
  STATUS_UPDATED: { label: 'Statut mis à jour', color: 'text-purple-400' },
  PRODUCT_UPDATED: { label: 'Produit modifié', color: 'text-indigo-400' },
  PRODUCT_ARCHIVED: { label: 'Produit archivé', color: 'text-gray-400' },
  CLIENT_ADDED: { label: 'Client ajouté', color: 'text-emerald-400' },
  SUPPLIER_ADDED: { label: 'Fournisseur ajouté', color: 'text-amber-400' },
  USER_CREATED: { label: 'Utilisateur créé', color: 'text-indigo-400' },
  USER_UPDATED: { label: 'Utilisateur modifié', color: 'text-blue-400' },
}

export default async function LogsPage() {
  const user = await getSession()
  if (!user || !['PATRON', 'GESTIONNAIRE'].includes(user.role)) redirect('/dashboard')

  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { name: true, color: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  return (
    <div className="flex flex-col h-full">
      <Topbar user={user} title="Audit & Logs" subtitle={`${logs.length} action(s) enregistrée(s)`} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ScrollText className="h-10 w-10 mx-auto mb-2 opacity-30" />
              Aucun log disponible
            </div>
          ) : logs.map(log => {
            const info = actionLabels[log.action] || { label: log.action, color: 'text-gray-400' }
            return (
              <div key={log.id} className="flex items-start gap-4 rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3 hover:border-gray-700 transition-colors">
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5" style={{ backgroundColor: log.user.color }}>
                  {log.user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold ${info.color}`}>{info.label}</span>
                    <span className="text-xs text-gray-500">par <strong className="text-gray-300">{log.user.name}</strong></span>
                  </div>
                  {log.details && <p className="text-xs text-gray-500 mt-0.5 truncate">{log.details}</p>}
                </div>
                <time className="text-xs text-gray-600 shrink-0">{formatDateTime(log.createdAt)}</time>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
