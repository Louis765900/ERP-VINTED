import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, PRODUCT_STATUSES } from '@/lib/utils'
import {
  TrendingUp, Package, ShoppingCart, Users, Euro,
  AlertTriangle, Clock, CheckCircle2, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { DashboardCharts } from '@/components/dashboard/charts'

async function getDashboardData() {
  const [products, sales, clients, recentSales, lowStockAlerts] = await Promise.all([
    prisma.product.findMany({ where: { status: { not: 'ARCHIVE' } }, include: { seller: true } }),
    prisma.sale.findMany({ include: { seller: true, product: true, client: true } }),
    prisma.client.findMany(),
    prisma.sale.findMany({
      orderBy: { date: 'desc' },
      take: 8,
      include: { seller: true, product: true, client: true },
    }),
    prisma.product.findMany({
      where: { status: 'RESERVE' },
      include: { seller: true },
    }),
  ])

  const totalCA = sales.reduce((sum, s) => sum + s.sellPrice, 0)
  const totalBuy = sales.reduce((sum, s) => sum + s.buyPrice, 0)
  const totalCommissions = sales.reduce((sum, s) => sum + s.commission, 0)
  const totalProfit = totalCA - totalBuy - totalCommissions

  // Stats par statut
  const statusCounts = PRODUCT_STATUSES.reduce((acc, s) => {
    acc[s.value] = products.filter(p => p.status === s.value).length
    return acc
  }, {} as Record<string, number>)

  // Ventes du mois
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const salesThisMonth = sales.filter(s => new Date(s.date) >= startOfMonth)
  const caThisMonth = salesThisMonth.reduce((sum, s) => sum + s.sellPrice, 0)

  // Ventes du mois dernier
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const salesLastMonth = sales.filter(s => {
    const d = new Date(s.date)
    return d >= startOfLastMonth && d < startOfMonth
  })
  const caLastMonth = salesLastMonth.reduce((sum, s) => sum + s.sellPrice, 0)
  const caGrowth = caLastMonth > 0 ? ((caThisMonth - caLastMonth) / caLastMonth) * 100 : 0

  // Réservations expirées (> 24h)
  const now24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const expiredReservations = products.filter(
    p => p.status === 'RESERVE' && p.reservedAt && new Date(p.reservedAt) < now24h
  )

  return {
    totalCA, totalProfit, totalCommissions, totalBuy,
    productsCount: products.length,
    clientsCount: clients.length,
    salesCount: sales.length,
    statusCounts,
    caThisMonth, caLastMonth, caGrowth,
    salesThisMonth: salesThisMonth.length,
    recentSales,
    expiredReservations,
    sales,
  }
}

export default async function DashboardPage() {
  const user = await getSession()
  const data = await getDashboardData()

  const kpis = [
    {
      title: 'Chiffre d\'Affaires Total',
      value: formatCurrency(data.totalCA),
      sub: `${data.salesCount} ventes`,
      icon: Euro,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'CA ce mois',
      value: formatCurrency(data.caThisMonth),
      sub: `${data.caGrowth >= 0 ? '+' : ''}${data.caGrowth.toFixed(1)}% vs mois dernier`,
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      trend: data.caGrowth,
    },
    {
      title: 'Bénéfice Net',
      value: formatCurrency(data.totalProfit),
      sub: `Commissions: ${formatCurrency(data.totalCommissions)}`,
      icon: ArrowUpRight,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Produits en Stock',
      value: data.productsCount.toString(),
      sub: `${data.statusCounts['DISPONIBLE'] || 0} disponibles`,
      icon: Package,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Clients',
      value: data.clientsCount.toString(),
      sub: `${data.salesThisMonth} ventes ce mois`,
      icon: Users,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <Topbar user={user!} title="Dashboard" subtitle="Vue d'ensemble de votre activité" />
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* Alertes */}
        {data.expiredReservations.length > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300">
              <strong>{data.expiredReservations.length} réservation(s) expirée(s)</strong> — plus de 24h sans action
            </p>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map(kpi => (
            <Card key={kpi.title}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-gray-400">{kpi.title}</p>
                  <div className={`rounded-lg p-2 ${kpi.bg}`}>
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-100">{kpi.value}</p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  {kpi.trend !== undefined && (
                    kpi.trend >= 0
                      ? <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                      : <ArrowDownRight className="h-3 w-3 text-red-400" />
                  )}
                  {kpi.sub}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Statuts produits */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {PRODUCT_STATUSES.map(s => (
            <Card key={s.value} className="text-center">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-gray-100">{data.statusCounts[s.value] || 0}</p>
                <Badge status={s.value} className="mt-1 text-[10px]" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Graphiques */}
        <DashboardCharts sales={data.sales} />

        {/* Ventes récentes */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-indigo-400" />
                Dernières ventes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentSales.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Aucune vente pour l'instant</p>
                ) : (
                  data.recentSales.map(sale => (
                    <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-100 truncate">{sale.product.name}</p>
                        <p className="text-xs text-gray-500">{sale.seller.name} · {formatDate(sale.date)}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-semibold text-emerald-400">{formatCurrency(sale.sellPrice)}</p>
                        <p className="text-xs text-gray-500">{sale.platform}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                Réservations actives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.statusCounts['RESERVE'] === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Aucune réservation active</p>
                ) : null}
                {/* This would need to be fetched separately for details */}
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle2 className="h-4 w-4 text-amber-400" />
                  <span>{data.statusCounts['RESERVE'] || 0} produit(s) réservé(s)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  <span>{data.statusCounts['PUBLIE'] || 0} produit(s) publié(s) sur Vinted</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle2 className="h-4 w-4 text-orange-400" />
                  <span>{data.statusCounts['A_EXPEDIER'] || 0} produit(s) à expédier</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
