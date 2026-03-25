import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const suppliers = await prisma.supplier.findMany({ include: { products: true }, orderBy: { name: 'asc' } })
  return NextResponse.json(suppliers)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const body = await request.json()
  const { name, contact, email, phone, address, notes } = body
  if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
  const supplier = await prisma.supplier.create({ data: { name, contact, email, phone, address, notes } })
  await prisma.auditLog.create({ data: { action: 'SUPPLIER_ADDED', entity: 'Supplier', entityId: supplier.id, details: `Fournisseur ajouté: ${name}`, userId: session.id } })
  return NextResponse.json(supplier, { status: 201 })
}
