import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { IS_DEMO_MODE, DEMO_COOKIE, getDemoProfile } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

export async function getServerProfile(): Promise<Profile> {
  if (IS_DEMO_MODE) {
    const cookieStore = await cookies()
    const userId = cookieStore.get(DEMO_COOKIE)?.value
    if (!userId) redirect('/login')
    const profile = getDemoProfile(userId)
    if (!profile) redirect('/login')
    return profile
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*)')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile) redirect('/login')
  return profile as Profile
}
