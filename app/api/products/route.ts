import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const category = searchParams.get('category')

  const where: Record<string, unknown> = { status: { not: 'ARCHIVE' } }
  if (status && status !== 'all') where.status = status
  if (category) where.category = category
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { barcode: { contains: search } },
      { location: { contains: search } },
    ]
  }

  const products = await prisma.product.findMany({
    where,
    include: { seller: { select: { id: true, name: true, color: true } }, supplier: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(products)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const body = await request.json()
    const { name, description, barcode, location, category, buyPrice, displayPrice, minPrice, hasFlaw, notes, supplierId } = body

    if (!name || !buyPrice || !displayPrice || !minPrice) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }
    if (displayPrice < minPrice) {
      return NextResponse.json({ error: 'Le prix affiché doit être >= au prix minimum' }, { status: 400 })
    }
    if (buyPrice > displayPrice) {
      return NextResponse.json({ error: 'Le prix d\'achat ne peut pas dépasser le prix affiché' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name, description, barcode, location, category,
        buyPrice: parseFloat(buyPrice),
        displayPrice: parseFloat(displayPrice),
        minPrice: parseFloat(minPrice),
        hasFlaw: Boolean(hasFlaw),
        notes,
        supplierId: supplierId || null,
        status: 'DISPONIBLE',
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'PRODUCT_ADDED',
        entity: 'Product',
        entityId: product.id,
        details: `Produit ajouté: ${name} (achat: ${buyPrice}€)`,
        userId: session.id,
      },
    })

    // Update supplier total purchases
    if (supplierId) {
      await prisma.supplier.update({
        where: { id: supplierId },
        data: { totalPurchases: { increment: parseFloat(buyPrice) } },
      })
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
