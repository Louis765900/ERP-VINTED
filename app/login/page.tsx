'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (res.ok) {
        toast('success', `Bienvenue, ${data.name} !`)
        router.push('/dashboard')
        router.refresh()
      } else {
        toast('error', data.error || 'Identifiants incorrects')
      }
    } catch {
      toast('error', 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-sm p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/25">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">TOM ERP</h1>
              <p className="text-xs text-gray-500">Gestion Vinted Professionnelle</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-100">Connexion</h2>
            <p className="text-sm text-gray-500 mt-1">Accédez à votre espace de gestion</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                type="text"
                placeholder="ex: tom"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connexion...</>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-gray-800 bg-gray-950/50 p-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Comptes de test :</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
              <span>tom / tom123</span><span className="text-yellow-600">Patron</span>
              <span>noa / noa123</span><span className="text-blue-600">Vendeur</span>
              <span>louis / louis123</span><span className="text-blue-600">Vendeur</span>
              <span>stock / stock123</span><span className="text-purple-600">Gestionnaire</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
