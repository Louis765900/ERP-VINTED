'use client'
import { useState, useMemo } from 'react'
import { Search, FileText, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { SessionUser } from '@/lib/auth'

interface Sale {
  id: string
  invoiceNumber: string
  sellPrice: number
  buyPrice: number
  commission: number
  profit: number
  platform: string
  notes?: string | null
  date: Date | string
  product: { id: string; name: string; category?: string | null; hasFlaw: boolean }
  seller: { id: string; name: string; color: string }
  client?: { id: string; name: string } | null
}

interface Props {
  sales: Sale[]
  user: SessionUser
}

export function VentesClient({ sales, user }: Props) {
  const [search, setSearch] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [filterSeller, setFilterSeller] = useState('all')
  const [invoiceModal, setInvoiceModal] = useState<Sale | null>(null)

  const sellers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string }>()
    sales.forEach(s => map.set(s.seller.id, s.seller))
    return Array.from(map.values())
  }, [sales])

  const platforms = useMemo(() => [...new Set(sales.map(s => s.platform))], [sales])

  const filtered = useMemo(() => {
    return sales.filter(s => {
      if (filterPlatform !== 'all' && s.platform !== filterPlatform) return false
      if (filterSeller !== 'all' && s.seller.id !== filterSeller) return false
      if (search) {
        const q = search.toLowerCase()
        return s.product.name.toLowerCase().includes(q) ||
          s.invoiceNumber.toLowerCase().includes(q) ||
          (s.client?.name || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [sales, search, filterPlatform, filterSeller])

  function handlePrint(sale: Sale) {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>Facture ${sale.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #111; }
        h1 { color: #6366f1; } table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f3f4f6; text-align: left; padding: 10px; }
        td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        .total { font-size: 1.2em; font-weight: bold; }
        .header { display: flex; justify-content: space-between; }
      </style></head><body>
      <div class="header">
        <div><h1>TOM ERP</h1><p>Facture de vente</p></div>
        <div><p><strong>${sale.invoiceNumber}</strong></p><p>${formatDateTime(sale.date)}</p></div>
      </div>
      <hr/>
      <table>
        <tr><th>Désignation</th><th>Montant</th></tr>
        <tr><td>${sale.product.name}</td><td>${formatCurrency(sale.sellPrice)}</td></tr>
        <tr><td>Commission vendeur (25%)</td><td>${formatCurrency(sale.commission)}</td></tr>
        <tr><td>Coût d'achat</td><td>${formatCurrency(sale.buyPrice)}</td></tr>
        <tr class="total"><td>Bénéfice net boutique</td><td>${formatCurrency(sale.profit)}</td></tr>
      </table>
      <p>Vendeur : ${sale.seller.name} | Plateforme : ${sale.platform}</p>
      ${sale.client ? `<p>Client : ${sale.client.name}</p>` : ''}
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input placeholder="Rechercher..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} className="w-40">
          <option value="all">Toutes plateformes</option>
          {platforms.map(p => <option key={p} value={p}>{p}</option>)}
        </Select>
        {user.role !== 'VENDEUR' && (
          <Select value={filterSeller} onChange={e => setFilterSeller(e.target.value)} className="w-40">
            <option value="all">Tous vendeurs</option>
            {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        )}
      </div>

      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/50">
              <th className="px-4 py-3 text-left font-medium text-gray-400">N° Facture</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Produit</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Vendeur</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Client</th>
              <th className="px-4 py-3 text-right font-medium text-gray-400">Prix vente</th>
              <th className="px-4 py-3 text-right font-medium text-gray-400">Commission</th>
              <th className="px-4 py-3 text-right font-medium text-gray-400">Bénéfice</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Plateforme</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Date</th>
              <th className="px-4 py-3 text-center font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-500">Aucune vente trouvée</td></tr>
            ) : filtered.map(sale => (
              <tr key={sale.id} className="hover:bg-gray-900/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-indigo-400">{sale.invoiceNumber}</td>
                <td className="px-4 py-3 font-medium text-gray-100">{sale.product.name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: sale.seller.color }}>
                      {sale.seller.name.charAt(0)}
                    </div>
                    <span className="text-xs text-gray-300">{sale.seller.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">{sale.client?.name || '—'}</td>
                <td className="px-4 py-3 text-right font-semibold text-emerald-400">{formatCurrency(sale.sellPrice)}</td>
                <td className="px-4 py-3 text-right text-amber-400">{formatCurrency(sale.commission)}</td>
                <td className="px-4 py-3 text-right text-blue-400">{formatCurrency(sale.profit)}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{sale.platform}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(sale.date)}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handlePrint(sale)} className="rounded p-1.5 text-indigo-400 hover:bg-indigo-500/10 transition-colors" title="Imprimer facture">
                    <FileText className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-600">{filtered.length} vente(s) affichée(s)</p>
    </div>
  )
}
