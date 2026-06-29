import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getServerProfile } from '@/lib/server-session'
import { IS_DEMO_MODE } from '@/lib/demo'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types'

export default async function AdminNotificacoesPage() {
  const profile = await getServerProfile()

  let notifications: any[] | null = []

  if (!IS_DEMO_MODE) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
    notifications = data
  }

  const TYPE_ICONS: Record<string, string> = {
    nova_demanda: '📋',
    status_atualizado: '🔄',
    demanda_concluida: '✅',
    prazo_proximo: '⚠️',
    fatura_gerada: '💰',
    documento_anexado: '📎',
    sistema: '🔔',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {(notifications ?? []).filter((n: Notification) => !n.is_read).length} não lida(s)
        </p>
      </div>

      {!notifications || notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Nenhuma notificação" description="Suas notificações aparecerão aqui." />
      ) : (
        <div className="space-y-2">
          {(notifications as Notification[]).map((notif) => (
            <Card key={notif.id} className={cn(!notif.is_read && 'border-blue-200 bg-blue-50/50')}>
              <CardContent className="p-4 flex gap-3">
                <span className="text-xl flex-shrink-0">{TYPE_ICONS[notif.type] ?? '🔔'}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm font-medium', !notif.is_read ? 'text-gray-900' : 'text-gray-700')}>
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(notif.created_at)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
