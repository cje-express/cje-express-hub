import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { IS_DEMO_MODE, DEMO_COOKIE, getDemoProfile } from '@/lib/demo'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import type { Profile } from '@/types'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let profile: Profile | null = null

  if (IS_DEMO_MODE) {
    const cookieStore = await cookies()
    const userId = cookieStore.get(DEMO_COOKIE)?.value
    if (!userId) redirect('/login')
    profile = getDemoProfile(userId)
    if (!profile) redirect('/login')
    if (profile.role !== 'SUPER_ADMIN_CJE' && profile.role !== 'OPERADOR_CJE') {
      redirect('/cliente/dashboard')
    }
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data } = await supabase
      .from('profiles')
      .select('*, organization:organizations(*)')
      .eq('auth_user_id', user.id)
      .single()

    if (!data) redirect('/login')
    profile = data as Profile

    if (profile.role !== 'SUPER_ADMIN_CJE' && profile.role !== 'OPERADOR_CJE') {
      redirect('/cliente/dashboard')
    }

    const supabaseForCount = await createClient()
    const { count: unreadCount } = await supabaseForCount
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false)

    return (
      <DashboardLayout profile={profile} isAdmin={true} unreadNotifications={unreadCount ?? 0}>
        {children}
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout profile={profile} isAdmin={true} unreadNotifications={0}>
      {children}
    </DashboardLayout>
  )
}
