'use client'
import { useState, useMemo, useCallback } from 'react'
import { Plus, Search, Filter, Package, Edit2, Trash2, CheckCircle, XCircle, Eye, Tag, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDate, PRODUCT_STATUSES, CATEGORIES } from '@/lib/utils'
import type { SessionUser } from '@/lib/auth'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  description?: string | null
  barcode?: string | null
  location?: string | null
  category?: string | null
  buyPrice: number
  displayPrice: number
  minPrice: number
  sellPrice?: number | null
  hasFlaw: boolean
  status: string
  createdAt: Date | string
  reservedAt?: Date | string | null
  notes?: string | null
  seller?: { id: string; name: string; color: string } | null
  supplier?: { id: string; name: string } | null
}

interface Supplier {
  id: string
  name: string
}

interface Props {
  initialProducts: Product[]
  suppliers: Supplier[]
  user: SessionUser
}

const EMPTY_FORM = {
  name: '', description: '', barcode: '', location: '', category: '',
  buyPrice: '', displayPrice: '', minPrice: '', hasFlaw: false,
  notes: '', supplierId: '',
}

export function StockClient({ initialProducts, suppliers, user }: Props) {
  const [products, setProducts] = useState(initialProducts)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState<Product | null>(null)
  const [sellModal, setSellModal] = useState<Product | null>(null)
  const [publishModal, setPublishModal] = useState<Product | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [sellForm, setSellForm] = useState({ sellPrice: '', platform: 'Vinted', clientName: '', clientEmail: '', notes: '' })
  const [publishPrice, setPublishPrice] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (filterStatus !== 'all' && p.status !== filterStatus) return false
      if (filterCategory !== 'all' && p.category !== filterCategory) return false
      if (search) {
        const q = search.toLowerCase()
        return p.name.toLowerCase().includes(q) ||
          (p.barcode || '').toLowerCase().includes(q) ||
          (p.location || '').toLowerCase().includes(q) ||
          (p.seller?.name || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [products, search, filterStatus, filterCategory])

  const reload = useCallback(async () => {
    const res = await fetch('/api/products')
    if (res.ok) setProducts(await res.json())
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast('success', 'Produit ajouté avec succès')
        setAddModal(false)
        setForm(EMPTY_FORM)
        await reload()
        router.refresh()
      } else {
        const d = await res.json()
        toast('error', d.error)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleReserve(product: Product) {
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reserve' }),
    })
    if (res.ok) { toast('success', 'Produit réservé !'); await reload() }
    else { const d = await res.json(); toast('error', d.error) }
  }

  async function handleCancelReserve(product: Product) {
    if (!confirm('Annuler la réservation ?')) return
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel_reserve' }),
    })
    if (res.ok) { toast('info', 'Réservation annulée'); await reload() }
    else { const d = await res.json(); toast('error', d.error) }
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault()
    if (!publishModal) return
    setLoading(true)
    const res = await fetch(`/api/products/${publishModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'publish', displayPrice: publishPrice || publishModal.displayPrice }),
    })
    setLoading(false)
    if (res.ok) { toast('success', 'Publié sur Vinted !'); setPublishModal(null); await reload() }
    else { const d = await res.json(); toast('error', d.error) }
  }

  async function handleSell(e: React.FormEvent) {
    e.preventDefault()
    if (!sellModal) return
    setLoading(true)
    const res = await fetch(`/api/products/${sellModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sold', ...sellForm }),
    })
    setLoading(false)
    if (res.ok) { toast('success', 'Vente enregistrée !'); setSellModal(null); await reload(); router.refresh() }
    else { const d = await res.json(); toast('error', d.error) }
  }

  async function handleStatusUpdate(product: Product, status: string) {
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status_update', status }),
    })
    if (res.ok) { await reload() }
    else { const d = await res.json(); toast('error', d.error) }
  }

  async function handleArchive(product: Product) {
    if (!confirm(`Archiver "${product.name}" ?`)) return
    const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' })
    if (res.ok) { toast('info', 'Produit archivé'); await reload() }
    else toast('error', 'Erreur')
  }

  const isExpired = (p: Product) => {
    if (!p.reservedAt) return false
    return Date.now() - new Date(p.reservedAt).getTime() > 24 * 60 * 60 * 1000
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-800 bg-gray-950 px-6 py-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input placeholder="Rechercher..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-44">
          <option value="all">Tous les statuts</option>
          {PRODUCT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
        <Select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-44">
          <option value="all">Toutes les catégories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Button onClick={() => { setForm(EMPTY_FORM); setAddModal(true) }}>
          <Plus className="mr-2 h-4 w-4" />Ajouter
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="px-4 py-3 text-left font-medium text-gray-400">Produit</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">Catégorie</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">Vendeur</th>
                <th className="px-4 py-3 text-right font-medium text-gray-400">Achat</th>
                <th className="px-4 py-3 text-right font-medium text-gray-400">Affiché</th>
                <th className="px-4 py-3 text-right font-medium text-gray-400">Min</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">Statut</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">Date</th>
                <th className="px-4 py-3 text-center font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    Aucun produit trouvé
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id} className={`hover:bg-gray-900/50 transition-colors ${isExpired(p) ? 'bg-amber-500/5' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-gray-100">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.barcode || p.location || '—'}</p>
                      </div>
                      {p.hasFlaw && <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded px-1.5 py-0.5">Défaut</span>}
                      {isExpired(p) && <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-1.5 py-0.5">Expirée</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.category || '—'}</td>
                  <td className="px-4 py-3">
                    {p.seller ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: p.seller.color }}>
                          {p.seller.name.charAt(0)}
                        </div>
                        <span className="text-xs text-gray-300">{p.seller.name}</span>
                      </div>
                    ) : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">{formatCurrency(p.buyPrice)}</td>
                  <td className="px-4 py-3 text-right text-gray-100 font-medium">{formatCurrency(p.displayPrice)}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{formatCurrency(p.minPrice)}</td>
                  <td className="px-4 py-3"><Badge status={p.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {p.status === 'DISPONIBLE' && (
                        <button onClick={() => handleReserve(p)} className="rounded p-1.5 text-blue-400 hover:bg-blue-500/10 transition-colors" title="Réserver">
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {p.status === 'RESERVE' && (
                        <>
                          <button onClick={() => { setPublishModal(p); setPublishPrice(String(p.displayPrice)) }} className="rounded p-1.5 text-blue-400 hover:bg-blue-500/10 transition-colors" title="Publier">
                            <Tag className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleCancelReserve(p)} className="rounded p-1.5 text-amber-400 hover:bg-amber-500/10 transition-colors" title="Annuler réservation">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {['PUBLIE', 'RESERVE'].includes(p.status) && (
                        <button onClick={() => { setSellModal(p); setSellForm({ sellPrice: String(p.displayPrice), platform: 'Vinted', clientName: '', clientEmail: '', notes: '' }) }} className="rounded p-1.5 text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Marquer vendu">
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                      {p.status === 'A_EXPEDIER' && (
                        <button onClick={() => handleStatusUpdate(p, 'EN_LIVRAISON')} className="rounded p-1.5 text-purple-400 hover:bg-purple-500/10 transition-colors" title="En livraison">
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                      {p.status === 'EN_LIVRAISON' && (
                        <button onClick={() => handleStatusUpdate(p, 'LIVRE')} className="rounded p-1.5 text-green-400 hover:bg-green-500/10 transition-colors" title="Livré">
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {user.role !== 'VENDEUR' && (
                        <button onClick={() => handleArchive(p)} className="rounded p-1.5 text-red-400 hover:bg-red-500/10 transition-colors" title="Archiver">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-600">{filtered.length} produit(s) affiché(s)</p>
      </div>

      {/* Modal Ajouter */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Ajouter un produit" size="lg">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Nom du produit *</Label>
              <Input placeholder="ex: Robe fleurie H&M" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="">Sélectionner...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fournisseur</Label>
              <Select value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})}>
                <option value="">Aucun</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Code-barre</Label>
              <Input placeholder="EAN13..." value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Emplacement</Label>
              <Input placeholder="ex: Étagère A3" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Prix d'achat (€) *</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.buyPrice} onChange={e => setForm({...form, buyPrice: e.target.value})} required />
            </div>
            <div className="space-y-1.5">
              <Label>Prix affiché (€) *</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.displayPrice} onChange={e => setForm({...form, displayPrice: e.target.value})} required />
            </div>
            <div className="space-y-1.5">
              <Label>Prix minimum (€) *</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.minPrice} onChange={e => setForm({...form, minPrice: e.target.value})} required />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Description du produit..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes internes</Label>
              <Textarea placeholder="Notes..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="hasFlaw" checked={form.hasFlaw} onChange={e => setForm({...form, hasFlaw: e.target.checked})} className="rounded" />
              <Label htmlFor="hasFlaw">Produit avec défaut(s)</Label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setAddModal(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Ajout...</> : 'Ajouter'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Publier */}
      <Modal open={!!publishModal} onClose={() => setPublishModal(null)} title="Publier sur Vinted" size="sm">
        {publishModal && (
          <form onSubmit={handlePublish} className="space-y-4">
            <p className="text-sm text-gray-400">Produit : <strong className="text-gray-100">{publishModal.name}</strong></p>
            <div className="space-y-1.5">
              <Label>Prix de publication (€)</Label>
              <Input type="number" step="0.01" value={publishPrice} onChange={e => setPublishPrice(e.target.value)} />
              <p className="text-xs text-gray-500">Min: {formatCurrency(publishModal.minPrice)} | Actuel: {formatCurrency(publishModal.displayPrice)}</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setPublishModal(null)}>Annuler</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Publier
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Vente */}
      <Modal open={!!sellModal} onClose={() => setSellModal(null)} title="Enregistrer la vente" size="md">
        {sellModal && (
          <form onSubmit={handleSell} className="space-y-4">
            <p className="text-sm text-gray-400">Produit : <strong className="text-gray-100">{sellModal.name}</strong></p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Prix de vente réel (€) *</Label>
                <Input type="number" step="0.01" value={sellForm.sellPrice} onChange={e => setSellForm({...sellForm, sellPrice: e.target.value})} required />
              </div>
              <div className="space-y-1.5">
                <Label>Plateforme</Label>
                <Select value={sellForm.platform} onChange={e => setSellForm({...sellForm, platform: e.target.value})}>
                  {['Vinted', 'Leboncoin', 'eBay', 'Facebook', 'Instagram', 'Autre'].map(p => <option key={p} value={p}>{p}</option>)}
                </Select>
              </div>
            </div>
            {sellForm.sellPrice && (
              <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-gray-500 text-xs">Commission (25%)</p>
                    <p className="text-amber-400 font-semibold">{formatCurrency(parseFloat(sellForm.sellPrice || '0') * 0.25)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Achat</p>
                    <p className="text-red-400 font-semibold">{formatCurrency(sellModal.buyPrice)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Bénéfice</p>
                    <p className="text-emerald-400 font-semibold">
                      {formatCurrency(parseFloat(sellForm.sellPrice || '0') - sellModal.buyPrice - parseFloat(sellForm.sellPrice || '0') * 0.25)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nom du client</Label>
                <Input placeholder="Optionnel" value={sellForm.clientName} onChange={e => setSellForm({...sellForm, clientName: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label>Email du client</Label>
                <Input type="email" placeholder="Optionnel" value={sellForm.clientEmail} onChange={e => setSellForm({...sellForm, clientEmail: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setSellModal(null)}>Annuler</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Valider la vente
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
