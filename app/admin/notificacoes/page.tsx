import { createClient } from '@/lib/supabase/server'
import { getServerProfile } from '@/lib/server-session'
import { IS_DEMO_MODE } from '@/lib/demo'
import { NotificationsView } from '@/components/NotificationsView'
import type { Notification } from '@/types'

export default async function AdminNotificacoesPage() {
  const profile = await getServerProfile()

  let notifications: Notification[] = []

  if (!IS_DEMO_MODE) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
    notifications = (data as Notification[]) ?? []
  }

  return <NotificationsView notifications={notifications} isAdmin />
}
