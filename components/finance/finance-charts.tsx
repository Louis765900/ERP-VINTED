'use client'
import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface Sale {
  id: string
  date: Date | string
  sellPrice: number
  buyPrice: number
  commission: number
  profit: number
  platform: string
}

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const PLATFORM_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']

export function FinanceCharts({ sales }: { sales: Sale[] }) {
  const monthlyData = useMemo(() => {
    const now = new Date()
    const data = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      return { month: MONTHS_FR[d.getMonth()], monthNum: d.getMonth(), year: d.getFullYear(), ca: 0, profit: 0, buyPrice: 0 }
    })
    sales.forEach(s => {
      const d = new Date(s.date)
      const idx = data.findIndex(m => m.monthNum === d.getMonth() && m.year === d.getFullYear())
      if (idx >= 0) { data[idx].ca += s.sellPrice; data[idx].profit += s.profit; data[idx].buyPrice += s.buyPrice }
    })
    return data
  }, [sales])

  const platformData = useMemo(() => {
    const map = new Map<string, number>()
    sales.forEach(s => map.set(s.platform, (map.get(s.platform) || 0) + s.sellPrice))
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [sales])

  const tooltip = { backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#f3f4f6' }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Évolution sur 12 mois</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
              <Tooltip contentStyle={tooltip} formatter={(v) => formatCurrency(Number(v))} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
              <Line type="monotone" dataKey="ca" name="CA" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="profit" name="Bénéfice" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="buyPrice" name="Achats" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>CA par plateforme</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={platformData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {platformData.map((_, i) => <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltip} formatter={(v) => formatCurrency(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
