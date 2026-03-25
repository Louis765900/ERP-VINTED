import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/layout/topbar'
import { UtilisateursClient } from '@/components/utilisateurs/utilisateurs-client'

export default async function UtilisateursPage() {
  const user = await getSession()
  if (!user || user.role !== 'PATRON') redirect('/dashboard')

  const users = await prisma.user.findMany({
    include: {
      sales: { select: { id: true, sellPrice: true, commission: true } },
      _count: { select: { products: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div className="flex flex-col h-full">
      <Topbar user={user} title="Utilisateurs" subtitle={`${users.length} compte(s)`} />
      <div className="flex-1 overflow-y-auto p-6">
        <UtilisateursClient initialUsers={users} currentUser={user} />
      </div>
    </div>
  )
}
