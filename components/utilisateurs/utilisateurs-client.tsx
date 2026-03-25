'use client'
import { useState } from 'react'
import { Plus, Shield, ToggleLeft, ToggleRight, Loader2, UserCheck, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDate, ROLES } from '@/lib/utils'
import type { SessionUser } from '@/lib/auth'
import { useRouter } from 'next/navigation'

interface UserSale { id: string; sellPrice: number; commission: number }
interface User {
  id: string; username: string; name: string; role: string; color: string
  isActive: boolean; createdAt: Date | string
  sales: UserSale[]
  _count: { products: number }
}
interface Props { initialUsers: User[]; currentUser: SessionUser }

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#ec4899']

export function UtilisateursClient({ initialUsers, currentUser }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [addModal, setAddModal] = useState(false)
  const [form, setForm] = useState({ username: '', name: '', password: '', role: 'VENDEUR', color: '#6366f1' })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) {
        const u = await res.json()
        setUsers(prev => [...prev, { ...u, sales: [], _count: { products: 0 } }])
        toast('success', 'Utilisateur créé')
        setAddModal(false)
        setForm({ username: '', name: '', password: '', role: 'VENDEUR', color: '#6366f1' })
      } else { const d = await res.json(); toast('error', d.error) }
    } finally { setLoading(false) }
  }

  async function toggleActive(user: User) {
    const res = await fetch(`/api/users/${user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !user.isActive }) })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      toast('info', `Compte ${!user.isActive ? 'activé' : 'désactivé'}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddModal(true)}><Plus className="mr-2 h-4 w-4" />Créer un compte</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map(u => {
          const totalCA = u.sales.reduce((s, sale) => s + sale.sellPrice, 0)
          const totalComm = u.sales.reduce((s, sale) => s + sale.commission, 0)
          return (
            <Card key={u.id} className={!u.isActive ? 'opacity-50' : ''}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: u.color }}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-100">{u.name}</p>
                      <p className="text-xs text-gray-500">@{u.username}</p>
                    </div>
                  </div>
                  <Badge status={u.role} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                  <div className="rounded-lg border border-gray-800 p-2">
                    <p className="text-gray-500">Ventes</p>
                    <p className="font-semibold text-gray-100 text-sm">{u.sales.length}</p>
                  </div>
                  <div className="rounded-lg border border-gray-800 p-2">
                    <p className="text-gray-500">CA</p>
                    <p className="font-semibold text-emerald-400 text-sm">{formatCurrency(totalCA)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-800 p-2">
                    <p className="text-gray-500">Comm.</p>
                    <p className="font-semibold text-amber-400 text-sm">{formatCurrency(totalComm)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">Depuis {formatDate(u.createdAt)}</p>
                  {u.id !== currentUser.id && (
                    <button onClick={() => toggleActive(u)} className={`flex items-center gap-1 text-xs rounded-lg px-2 py-1 transition-colors ${u.isActive ? 'text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}>
                      {u.isActive ? <><UserX className="h-3 w-3" />Désactiver</> : <><UserCheck className="h-3 w-3" />Activer</>}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Créer un compte" size="sm">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1.5"><Label>Nom complet *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div className="space-y-1.5"><Label>Nom d'utilisateur *</Label><Input value={form.username} onChange={e => setForm({...form, username: e.target.value})} required /></div>
          <div className="space-y-1.5"><Label>Mot de passe *</Label><Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required /></div>
          <div className="space-y-1.5">
            <Label>Rôle *</Label>
            <Select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Couleur</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm({...form, color: c})}
                  className={`h-7 w-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-gray-900' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setAddModal(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Créer</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
