import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Identifiants requis' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Utilisateur introuvable ou désactivé' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
    }

    await createSession({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      color: user.color,
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        details: `Connexion de ${user.name}`,
        userId: user.id,
      },
    })

    return NextResponse.json({ name: user.name, role: user.role })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
