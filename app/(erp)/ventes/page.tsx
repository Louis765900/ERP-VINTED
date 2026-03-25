import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime, COMMISSION_RATE } from '@/lib/utils'
import { ShoppingCart, TrendingUp, Euro, Users } from 'lucide-react'
import { VentesClient } from '@/components/ventes/ventes-client'

async function getSalesData() {
  const sales = await prisma.sale.findMany({
    include: {
      product: { select: { id: true, name: true, category: true, hasFlaw: true } },
      seller: { select: { id: true, name: true, color: true } },
      client: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
  })
  return sales
}

export default async function VentesPage() {
  const user = await getSession()
  const sales = await getSalesData()

  const totalCA = sales.reduce((s, v) => s + v.sellPrice, 0)
  const totalProfit = sales.reduce((s, v) => s + v.profit, 0)
  const totalCommissions = sales.reduce((s, v) => s + v.commission, 0)

  return (
    <div className="flex flex-col h-full">
      <Topbar user={user!} title="Ventes" subtitle={`${sales.length} transaction(s)`} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            { icon: Euro, label: 'CA Total', value: formatCurrency(totalCA), color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: TrendingUp, label: 'Bénéfice Net', value: formatCurrency(totalProfit), color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: Users, label: 'Commissions', value: formatCurrency(totalCommissions), color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { icon: ShoppingCart, label: 'Nb ventes', value: sales.length.toString(), color: 'text-purple-400', bg: 'bg-purple-500/10' },
          ].map(k => (
            <Card key={k.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400">{k.label}</p>
                  <div className={`rounded-lg p-2 ${k.bg}`}><k.icon className={`h-4 w-4 ${k.color}`} /></div>
                </div>
                <p className="text-2xl font-bold text-gray-100">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <VentesClient sales={sales} user={user!} />
      </div>
    </div>
  )
}
