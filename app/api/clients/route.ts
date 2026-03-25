import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const clients = await prisma.client.findMany({ include: { sales: true }, orderBy: { totalSpent: 'desc' } })
  return NextResponse.json(clients)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const body = await request.json()
  const { name, email, phone, address, notes } = body
  if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
  const client = await prisma.client.create({ data: { name, email, phone, address, notes } })
  await prisma.auditLog.create({ data: { action: 'CLIENT_ADDED', entity: 'Client', entityId: client.id, details: `Client ajouté: ${name}`, userId: session.id } })
  return NextResponse.json(client, { status: 201 })
}
