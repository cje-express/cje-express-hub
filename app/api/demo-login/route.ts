import { NextResponse } from 'next/server'
import { validateDemoLogin, DEMO_COOKIE, IS_DEMO_MODE } from '@/lib/demo'

export async function POST(request: Request) {
  if (!IS_DEMO_MODE) {
    return NextResponse.json({ error: 'Not in demo mode' }, { status: 403 })
  }

  const { email, password } = await request.json()
  const profile = validateDemoLogin(email, password)

  if (!profile) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  const response = NextResponse.json({ role: profile.role })
  response.cookies.set(DEMO_COOKIE, profile.id, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  return response
}
