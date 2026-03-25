'use client'
import { useState, useMemo } from 'react'
import { Search, Plus, Truck, Mail, Phone, Package, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { SessionUser } from '@/lib/auth'

interface Product { id: string; status: string; buyPrice: number }
interface Supplier {
  id: string; name: string; contact?: string | null; email?: string | null
  phone?: string | null; address?: string | null; notes?: string | null
  totalPurchases: number; createdAt: Date | string; products: Product[]
}
interface Props { initialSuppliers: Supplier[]; user: SessionUser }

export function FournisseursClient({ initialSuppliers, user }: Props) {
  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [search, setSearch] = useState('')
  const [addModal, setAddModal] = useState(false)
  const [detailModal, setDetailModal] = useState<Supplier | null>(null)
  const [form, setForm] = useState({ name: '', contact: '', email: '', phone: '', address: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const filtered = useMemo(() => {
    if (!search) return suppliers
    const q = search.toLowerCase()
    return suppliers.filter(s => s.name.toLowerCase().includes(q) || (s.contact || '').toLowerCase().includes(q))
  }, [suppliers, search])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) {
        const s = await res.json()
        setSuppliers(prev => [...prev, { ...s, products: [] }].sort((a, b) => a.name.localeCompare(b.name)))
        toast('success', 'Fournisseur ajouté')
        setAddModal(false)
        setForm({ name: '', contact: '', email: '', phone: '', address: '', notes: '' })
      } else { const d = await res.json(); toast('error', d.error) }
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input placeholder="Rechercher..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => setAddModal(true)}><Plus className="mr-2 h-4 w-4" />Ajouter</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500"><Truck className="h-10 w-10 mx-auto mb-2 opacity-30" />Aucun fournisseur</div>
        ) : filtered.map(s => (
          <Card key={s.id} className="cursor-pointer hover:border-gray-600 transition-colors" onClick={() => setDetailModal(s)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-full bg-amber-600/20 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-400">{formatCurrency(s.totalPurchases)}</p>
                  <p className="text-xs text-gray-500">{s.products.length} produit(s)</p>
                </div>
              </div>
              <p className="font-semibold text-gray-100">{s.name}</p>
              {s.contact && <p className="text-xs text-gray-500 mt-1">{s.contact}</p>}
              {s.email && <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Mail className="h-3 w-3" />{s.email}</p>}
              {s.phone && <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{s.phone}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={detailModal?.name || ''} size="md">
        {detailModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-700 p-4">
                <p className="text-xs text-gray-500 mb-1">Achats totaux</p>
                <p className="text-2xl font-bold text-amber-400">{formatCurrency(detailModal.totalPurchases)}</p>
              </div>
              <div className="rounded-lg border border-gray-700 p-4">
                <p className="text-xs text-gray-500 mb-1">Produits fournis</p>
                <p className="text-2xl font-bold text-gray-100">{detailModal.products.length}</p>
              </div>
            </div>
            {detailModal.contact && <p className="text-sm text-gray-400">Contact: {detailModal.contact}</p>}
            {detailModal.email && <p className="text-sm text-gray-400 flex items-center gap-2"><Mail className="h-4 w-4" />{detailModal.email}</p>}
            {detailModal.phone && <p className="text-sm text-gray-400 flex items-center gap-2"><Phone className="h-4 w-4" />{detailModal.phone}</p>}
            {detailModal.address && <p className="text-sm text-gray-400">{detailModal.address}</p>}
            {detailModal.notes && <p className="text-sm text-gray-500 italic">{detailModal.notes}</p>}
            <p className="text-xs text-gray-600">Fournisseur depuis le {formatDate(detailModal.createdAt)}</p>
          </div>
        )}
      </Modal>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Nouveau fournisseur" size="md">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nom *</Label>
            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Contact</Label><Input value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} /></div>
            <div className="space-y-1.5"><Label>Téléphone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div className="space-y-1.5"><Label>Adresse</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
          </div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} /></div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setAddModal(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Ajouter</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
