'use client'
import { useState, useMemo } from 'react'
import { Search, Plus, Users, Mail, Phone, ShoppingBag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { SessionUser } from '@/lib/auth'

interface Sale {
  id: string
  invoiceNumber: string
  sellPrice: number
  date: Date | string
  platform: string
  product: { name: string }
  seller: { name: string }
}

interface Client {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  notes?: string | null
  totalSpent: number
  createdAt: Date | string
  sales: Sale[]
}

interface Props {
  initialClients: Client[]
  user: SessionUser
}

export function ClientsClient({ initialClients, user }: Props) {
  const [clients, setClients] = useState(initialClients)
  const [search, setSearch] = useState('')
  const [addModal, setAddModal] = useState(false)
  const [detailModal, setDetailModal] = useState<Client | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const filtered = useMemo(() => {
    if (!search) return clients
    const q = search.toLowerCase()
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    )
  }, [clients, search])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const newClient = await res.json()
        setClients(prev => [{ ...newClient, sales: [] }, ...prev])
        toast('success', 'Client ajouté')
        setAddModal(false)
        setForm({ name: '', email: '', phone: '', address: '', notes: '' })
      } else {
        const d = await res.json()
        toast('error', d.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input placeholder="Rechercher un client..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => setAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />Ajouter
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
            Aucun client
          </div>
        ) : filtered.map(client => (
          <Card
            key={client.id}
            className="cursor-pointer hover:border-gray-600 transition-colors"
            onClick={() => setDetailModal(client)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-full bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(client.totalSpent)}</p>
                  <p className="text-xs text-gray-500">{client.sales.length} achat(s)</p>
                </div>
              </div>
              <p className="font-semibold text-gray-100">{client.name}</p>
              {client.email && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Mail className="h-3 w-3" />{client.email}</p>}
              {client.phone && <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Phone className="h-3 w-3" />{client.phone}</p>}
              <p className="text-xs text-gray-600 mt-2">Client depuis le {formatDate(client.createdAt)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal détail client */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={detailModal?.name || ''} size="lg">
        {detailModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-700 p-4">
                <p className="text-xs text-gray-500 mb-1">Total dépensé</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(detailModal.totalSpent)}</p>
              </div>
              <div className="rounded-lg border border-gray-700 p-4">
                <p className="text-xs text-gray-500 mb-1">Achats</p>
                <p className="text-2xl font-bold text-gray-100">{detailModal.sales.length}</p>
              </div>
            </div>
            {detailModal.email && <p className="text-sm text-gray-400 flex items-center gap-2"><Mail className="h-4 w-4" />{detailModal.email}</p>}
            {detailModal.phone && <p className="text-sm text-gray-400 flex items-center gap-2"><Phone className="h-4 w-4" />{detailModal.phone}</p>}
            {detailModal.address && <p className="text-sm text-gray-400">{detailModal.address}</p>}
            {detailModal.notes && <p className="text-sm text-gray-500 italic">{detailModal.notes}</p>}

            {detailModal.sales.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />Historique des achats
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {detailModal.sales.map(sale => (
                    <div key={sale.id} className="flex items-center justify-between rounded-lg border border-gray-800 p-3">
                      <div>
                        <p className="text-sm text-gray-100">{sale.product.name}</p>
                        <p className="text-xs text-gray-500">{sale.seller.name} · {formatDate(sale.date)} · {sale.platform}</p>
                      </div>
                      <p className="text-sm font-semibold text-emerald-400">{formatCurrency(sale.sellPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal ajout */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Nouveau client" size="md">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nom *</Label>
            <Input placeholder="Prénom Nom" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Adresse</Label>
            <Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setAddModal(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Ajouter
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
