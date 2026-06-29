import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { DEMO_COOKIE, IS_DEMO_MODE, getDemoProfile } from '@/lib/demo'

export async function GET() {
  const cookieStore = await cookies()
  const userId = cookieStore.get(DEMO_COOKIE)?.value
  const profile = userId ? getDemoProfile(userId) : null
  return NextResponse.json({
    IS_DEMO_MODE,
    cookieValue: userId ?? null,
    profileId: profile?.id ?? null,
    profileRole: profile?.role ?? null,
  })
}
