import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'erp-tom-super-secret-key-2025-change-in-prod'
)

const PUBLIC_ROUTES = ['/login']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('erp-tom-session')?.value

  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))

  if (isPublic) {
    if (token) {
      try {
        await jwtVerify(token, SECRET)
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } catch {}
    }
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    await jwtVerify(token, SECRET)
    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('erp-tom-session')
    return response
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
