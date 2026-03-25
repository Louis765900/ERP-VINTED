import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/layout/topbar'
import { FournisseursClient } from '@/components/fournisseurs/fournisseurs-client'

export default async function FournisseursPage() {
  const user = await getSession()
  const suppliers = await prisma.supplier.findMany({
    include: { products: { select: { id: true, status: true, buyPrice: true } } },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="flex flex-col h-full">
      <Topbar user={user!} title="Fournisseurs" subtitle={`${suppliers.length} fournisseur(s)`} />
      <div className="flex-1 overflow-y-auto p-6">
        <FournisseursClient initialSuppliers={suppliers} user={user!} />
      </div>
    </div>
  )
}
