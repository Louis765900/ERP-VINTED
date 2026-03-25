import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Topbar } from '@/components/layout/topbar'
import { StockClient } from '@/components/stock/stock-client'

async function getStockData() {
  const [products, suppliers] = await Promise.all([
    prisma.product.findMany({
      where: { status: { not: 'ARCHIVE' } },
      include: {
        seller: { select: { id: true, name: true, color: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.supplier.findMany({ orderBy: { name: 'asc' } }),
  ])
  return { products, suppliers }
}

export default async function StockPage() {
  const user = await getSession()
  const { products, suppliers } = await getStockData()

  return (
    <div className="flex flex-col h-full">
      <Topbar user={user!} title="Stock" subtitle={`${products.length} produit(s) en inventaire`} />
      <div className="flex-1 overflow-hidden">
        <StockClient initialProducts={products} suppliers={suppliers} user={user!} />
      </div>
    </div>
  )
}
