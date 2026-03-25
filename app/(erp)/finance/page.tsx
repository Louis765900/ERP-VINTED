import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { FinanceCharts } from '@/components/finance/finance-charts'
import { Euro, TrendingUp, TrendingDown, Users, Package } from 'lucide-react'

export default async function FinancePage() {
  const user = await getSession()
  if (!user || !['PATRON', 'GESTIONNAIRE'].includes(user.role)) redirect('/dashboard')

  const [sales, products] = await Promise.all([
    prisma.sale.findMany({
      include: { seller: { select: { id: true, name: true, color: true } }, product: true },
      orderBy: { date: 'desc' },
    }),
    prisma.product.findMany({ where: { status: { not: 'ARCHIVE' } } }),
  ])

  const totalCA = sales.reduce((s, v) => s + v.sellPrice, 0)
  const totalBuy = sales.reduce((s, v) => s + v.buyPrice, 0)
  const totalCommissions = sales.reduce((s, v) => s + v.commission, 0)
  const totalProfit = totalCA - totalBuy - totalCommissions
  const margin = totalCA > 0 ? (totalProfit / totalCA) * 100 : 0

  // Par vendeur
  const byVendeur = new Map<string, { name: string; color: string; ca: number; commission: number; count: number }>()
  sales.forEach(s => {
    const existing = byVendeur.get(s.seller.id)
    if (existing) {
      existing.ca += s.sellPrice
      existing.commission += s.commission
      existing.count += 1
    } else {
      byVendeur.set(s.seller.id, { name: s.seller.name, color: s.seller.color, ca: s.sellPrice, commission: s.commission, count: 1 })
    }
  })

  // Stock valorisé
  const stockValue = products.reduce((s, p) => s + p.buyPrice, 0)
  const stockPotential = products
    .filter(p => ['DISPONIBLE', 'RESERVE', 'PUBLIE'].includes(p.status))
    .reduce((s, p) => s + p.displayPrice, 0)

  const vendeurStats = Array.from(byVendeur.entries()).map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.ca - a.ca)

  return (
    <div className="flex flex-col h-full">
      <Topbar user={user} title="Finance" subtitle="Tableau de bord financier" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: Euro, label: 'CA Total', value: formatCurrency(totalCA), color: 'text-emerald-400', bg: 'bg-emerald-500/10', sub: `${sales.length} ventes` },
            { icon: TrendingUp, label: 'Bénéfice Net', value: formatCurrency(totalProfit), color: 'text-blue-400', bg: 'bg-blue-500/10', sub: `Marge: ${margin.toFixed(1)}%` },
            { icon: TrendingDown, label: 'Coûts Totaux', value: formatCurrency(totalBuy), color: 'text-red-400', bg: 'bg-red-500/10', sub: `Commissions: ${formatCurrency(totalCommissions)}` },
            { icon: Package, label: 'Stock Valorisé', value: formatCurrency(stockValue), color: 'text-amber-400', bg: 'bg-amber-500/10', sub: `Potentiel: ${formatCurrency(stockPotential)}` },
          ].map(k => (
            <Card key={k.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400">{k.label}</p>
                  <div className={`rounded-lg p-2 ${k.bg}`}><k.icon className={`h-4 w-4 ${k.color}`} /></div>
                </div>
                <p className="text-2xl font-bold text-gray-100">{k.value}</p>
                <p className="text-xs text-gray-500 mt-1">{k.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Graphiques */}
        <FinanceCharts sales={sales} />

        {/* Performance par vendeur */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-indigo-400" />Performance par vendeur</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vendeurStats.map(v => (
                <div key={v.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-800">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: v.color }}>
                    {v.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-100">{v.name}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, (v.ca / totalCA) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-emerald-400">{formatCurrency(v.ca)}</p>
                    <p className="text-xs text-amber-400">Comm: {formatCurrency(v.commission)}</p>
                    <p className="text-xs text-gray-500">{v.count} vente(s)</p>
                  </div>
                </div>
              ))}
              {vendeurStats.length === 0 && <p className="text-center text-gray-500 py-4">Aucune donnée</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
