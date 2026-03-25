'use client'
import { useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface Sale {
  id: string
  date: Date | string
  sellPrice: number
  buyPrice: number
  commission: number
  profit: number
}

interface Props {
  sales: Sale[]
}

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

export function DashboardCharts({ sales }: Props) {
  const monthlyData = useMemo(() => {
    const now = new Date()
    const data = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      return {
        month: MONTHS_FR[d.getMonth()],
        year: d.getFullYear(),
        monthNum: d.getMonth(),
        ca: 0,
        profit: 0,
        commissions: 0,
        count: 0,
      }
    })

    sales.forEach(sale => {
      const d = new Date(sale.date)
      const idx = data.findIndex(m => m.monthNum === d.getMonth() && m.year === d.getFullYear())
      if (idx >= 0) {
        data[idx].ca += sale.sellPrice
        data[idx].profit += sale.sellPrice - sale.buyPrice - sale.commission
        data[idx].commissions += sale.commission
        data[idx].count += 1
      }
    })

    return data
  }, [sales])

  const tooltipStyle = {
    backgroundColor: '#111827',
    border: '1px solid #374151',
    borderRadius: '8px',
    color: '#f3f4f6',
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Chiffre d'affaires (6 derniers mois)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
              <Area type="monotone" dataKey="ca" name="CA" stroke="#6366f1" strokeWidth={2} fill="url(#caGrad)" />
              <Area type="monotone" dataKey="profit" name="Bénéfice" stroke="#10b981" strokeWidth={2} fill="url(#profitGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ventilation financière (6 mois)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
              <Bar dataKey="ca" name="CA" fill="#6366f1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="commissions" name="Commissions" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="profit" name="Bénéfice net" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
