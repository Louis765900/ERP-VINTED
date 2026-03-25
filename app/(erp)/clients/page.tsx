import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/layout/topbar'
import { ClientsClient } from '@/components/clients/clients-client'

export default async function ClientsPage() {
  const user = await getSession()
  const clients = await prisma.client.findMany({
    include: {
      sales: {
        include: { product: { select: { name: true } }, seller: { select: { name: true } } },
        orderBy: { date: 'desc' },
      },
    },
    orderBy: { totalSpent: 'desc' },
  })

  return (
    <div className="flex flex-col h-full">
      <Topbar user={user!} title="CRM Clients" subtitle={`${clients.length} client(s)`} />
      <div className="flex-1 overflow-y-auto p-6">
        <ClientsClient initialClients={clients} user={user!} />
      </div>
    </div>
  )
}
