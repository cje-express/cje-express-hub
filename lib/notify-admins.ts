import type { SupabaseClient } from '@supabase/supabase-js'

interface NotifyPayload {
  title: string
  message: string
  type: string
}

export async function notifyAdmins(supabase: SupabaseClient, payload: NotifyPayload) {
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['SUPER_ADMIN_CJE', 'OPERADOR_CJE'])
    .eq('status', 'active')

  if (!admins || admins.length === 0) return

  await supabase.from('notifications').insert(
    admins.map((admin) => ({
      user_id: admin.id,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      is_read: false,
    }))
  )
}
