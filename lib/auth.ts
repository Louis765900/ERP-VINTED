import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { cache } from 'react'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'erp-tom-super-secret-key-2025-change-in-prod'
)
const COOKIE_NAME = 'erp-tom-session'

export type SessionUser = {
  id: string
  username: string
  name: string
  role: string
  color: string
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return (payload as { user: SessionUser }).user
  } catch {
    return null
  }
})
