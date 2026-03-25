import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'PATRON') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const users = await prisma.user.findMany({ select: { id: true, username: true, name: true, role: true, color: true, isActive: true, createdAt: true } })
  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== 'PATRON') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { username, name, password, role, color } = await request.json()
  if (!username || !name || !password || !role) return NextResponse.json({ error: 'Champs requis' }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { username: username.toLowerCase() } })
  if (existing) return NextResponse.json({ error: 'Nom d\'utilisateur déjà pris' }, { status: 409 })

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { username: username.toLowerCase(), name, password: hashed, role, color: color || '#6366f1' },
    select: { id: true, username: true, name: true, role: true, color: true, isActive: true, createdAt: true },
  })
  await prisma.auditLog.create({ data: { action: 'USER_CREATED', entity: 'User', entityId: user.id, details: `Utilisateur créé: ${name} (${role})`, userId: session.id } })
  return NextResponse.json(user, { status: 201 })
}
