import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { COMMISSION_RATE, generateInvoiceNumber } from '@/lib/utils'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const product = await prisma.product.findUnique({
    where: { id },
    include: { seller: true, supplier: true, sale: { include: { client: true } } },
  })
  if (!product) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
  return NextResponse.json(product)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { action, ...data } = body

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })

  try {
    if (action === 'reserve') {
      if (product.status !== 'DISPONIBLE') {
        return NextResponse.json({ error: 'Seuls les produits disponibles peuvent être réservés' }, { status: 400 })
      }
      const updated = await prisma.product.update({
        where: { id },
        data: { status: 'RESERVE', sellerId: session.id, reservedAt: new Date() },
      })
      await prisma.auditLog.create({
        data: { action: 'PRODUCT_RESERVED', entity: 'Product', entityId: id, details: `Réservé par ${session.name}`, userId: session.id },
      })
      return NextResponse.json(updated)
    }

    if (action === 'cancel_reserve') {
      if (product.status !== 'RESERVE') {
        return NextResponse.json({ error: 'Ce produit n\'est pas réservé' }, { status: 400 })
      }
      if (product.sellerId !== session.id && session.role === 'VENDEUR') {
        return NextResponse.json({ error: 'Vous ne pouvez annuler que vos propres réservations' }, { status: 403 })
      }
      const updated = await prisma.product.update({
        where: { id },
        data: { status: 'DISPONIBLE', sellerId: null, reservedAt: null },
      })
      await prisma.auditLog.create({
        data: { action: 'RESERVATION_CANCELLED', entity: 'Product', entityId: id, details: `Réservation annulée par ${session.name}`, userId: session.id },
      })
      return NextResponse.json(updated)
    }

    if (action === 'publish') {
      if (product.status !== 'RESERVE') {
        return NextResponse.json({ error: 'Seuls les produits réservés peuvent être publiés' }, { status: 400 })
      }
      const { displayPrice } = data
      const updated = await prisma.product.update({
        where: { id },
        data: { status: 'PUBLIE', displayPrice: displayPrice ? parseFloat(displayPrice) : product.displayPrice, publishedAt: new Date() },
      })
      await prisma.auditLog.create({
        data: { action: 'PRODUCT_PUBLISHED', entity: 'Product', entityId: id, details: `Publié sur Vinted à ${updated.displayPrice}€`, userId: session.id },
      })
      return NextResponse.json(updated)
    }

    if (action === 'sold') {
      if (!['PUBLIE', 'RESERVE'].includes(product.status)) {
        return NextResponse.json({ error: 'Ce produit ne peut pas être marqué vendu' }, { status: 400 })
      }
      const { sellPrice, platform, clientId, clientName, clientEmail, notes: saleNotes } = data
      if (!sellPrice) return NextResponse.json({ error: 'Prix de vente requis' }, { status: 400 })

      const price = parseFloat(sellPrice)
      const commission = price * COMMISSION_RATE
      const profit = price - product.buyPrice - commission

      let finalClientId = clientId || null
      if (!clientId && clientName) {
        const newClient = await prisma.client.create({
          data: { name: clientName, email: clientEmail || null },
        })
        finalClientId = newClient.id
      }

      const invoiceNumber = generateInvoiceNumber()
      const updated = await prisma.product.update({
        where: { id },
        data: { status: 'A_EXPEDIER', sellPrice: price, soldAt: new Date() },
      })

      await prisma.sale.create({
        data: {
          invoiceNumber,
          sellPrice: price,
          buyPrice: product.buyPrice,
          commission,
          profit,
          platform: platform || 'Vinted',
          notes: saleNotes,
          productId: id,
          sellerId: product.sellerId || session.id,
          clientId: finalClientId,
        },
      })

      if (finalClientId) {
        await prisma.client.update({
          where: { id: finalClientId },
          data: { totalSpent: { increment: price } },
        })
      }

      await prisma.auditLog.create({
        data: { action: 'PRODUCT_SOLD', entity: 'Product', entityId: id, details: `Vendu ${price}€ sur ${platform || 'Vinted'} | Comm: ${commission.toFixed(2)}€`, userId: session.id },
      })
      return NextResponse.json(updated)
    }

    if (action === 'status_update') {
      const { status } = data
      const updated = await prisma.product.update({
        where: { id },
        data: {
          status,
          ...(status === 'VENDU' ? { soldAt: new Date() } : {}),
        },
      })
      await prisma.auditLog.create({
        data: { action: 'STATUS_UPDATED', entity: 'Product', entityId: id, details: `Statut: ${product.status} → ${status}`, userId: session.id },
      })
      return NextResponse.json(updated)
    }

    // Generic update (edit product fields)
    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        barcode: data.barcode,
        location: data.location,
        category: data.category,
        buyPrice: data.buyPrice ? parseFloat(data.buyPrice) : undefined,
        displayPrice: data.displayPrice ? parseFloat(data.displayPrice) : undefined,
        minPrice: data.minPrice ? parseFloat(data.minPrice) : undefined,
        hasFlaw: data.hasFlaw !== undefined ? Boolean(data.hasFlaw) : undefined,
        notes: data.notes,
        supplierId: data.supplierId || undefined,
      },
    })
    await prisma.auditLog.create({
      data: { action: 'PRODUCT_UPDATED', entity: 'Product', entityId: id, details: `Produit modifié: ${updated.name}`, userId: session.id },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session || session.role !== 'PATRON') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })

  await prisma.product.update({ where: { id }, data: { status: 'ARCHIVE' } })
  await prisma.auditLog.create({
    data: { action: 'PRODUCT_ARCHIVED', entity: 'Product', entityId: id, details: `Produit archivé: ${product.name}`, userId: session.id },
  })

  return NextResponse.json({ success: true })
}
