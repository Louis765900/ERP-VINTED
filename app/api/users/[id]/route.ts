import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session || session.role !== 'PATRON') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await request.json()
  const { name, role, color, isActive, password } = body

  const updateData: Record<string, unknown> = {}
  if (name) updateData.name = name
  if (role) updateData.role = role
  if (color) updateData.color = color
  if (isActive !== undefined) updateData.isActive = isActive
  if (password) updateData.password = await bcrypt.hash(password, 12)

  const user = await prisma.user.update({ where: { id }, data: updateData, select: { id: true, username: true, name: true, role: true, color: true, isActive: true } })
  await prisma.auditLog.create({ data: { action: 'USER_UPDATED', entity: 'User', entityId: id, details: `Utilisateur modifié: ${user.name}`, userId: session.id } })
  return NextResponse.json(user)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session || session.role !== 'PATRON') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  if (id === session.id) return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 })

  await prisma.user.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}
