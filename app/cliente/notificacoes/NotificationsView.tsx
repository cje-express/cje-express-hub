'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types'

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  nova_demanda:       { icon: '📋', color: 'bg-blue-100 border-blue-200' },
  status_atualizado:  { icon: '🔄', color: 'bg-purple-100 border-purple-200' },
  demanda_concluida:  { icon: '✅', color: 'bg-green-100 border-green-200' },
  prazo_proximo:      { icon: '⚠️', color: 'bg-amber-100 border-amber-200' },
  fatura_gerada:      { icon: '💰', color: 'bg-emerald-100 border-emerald-200' },
  documento_anexado:  { icon: '📎', color: 'bg-gray-100 border-gray-200' },
  sistema:            { icon: '🔔', color: 'bg-gray-100 border-gray-200' },
}

interface NotificationsViewProps {
  notifications: Notification[]
  unreadCount: number
}

export function NotificationsView({ notifications, unreadCount: initialUnread }: NotificationsViewProps) {
  const [items, setItems] = useState(notifications)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const unreadCount = items.filter((n) => !n.is_read).length
  const filtered = filter === 'unread' ? items.filter((n) => !n.is_read) : items

  function markAsRead(id: string) {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
    toast.success('Todas as notificações foram marcadas como lidas.')
  }

  function getDemandLink(notif: Notification) {
    if (notif.demand_id) return `/cliente/demandas/${notif.demand_id}`
    if (notif.invoice_id) return `/cliente/financeiro/${notif.invoice_id}`
    return null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Todas lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todas ({items.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Não lidas ({unreadCount})
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
          description="Você receberá notificações sobre alterações nas suas demandas e faturas."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.sistema
            const link = getDemandLink(notif)

            const content = (
              <Card
                className={cn(
                  'transition-all hover:shadow-md cursor-pointer',
                  !notif.is_read && 'border-blue-300 bg-blue-50/30 shadow-sm'
                )}
                onClick={() => markAsRead(notif.id)}
              >
                <CardContent className="p-4 flex gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 text-lg border', config.color)}>
                    {config.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-medium', !notif.is_read ? 'text-gray-900' : 'text-gray-700')}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1 animate-pulse" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1.5">{formatDateTime(notif.created_at)}</p>
                  </div>
                </CardContent>
              </Card>
            )

            return link ? (
              <Link key={notif.id} href={link} onClick={() => markAsRead(notif.id)}>
                {content}
              </Link>
            ) : (
              <div key={notif.id}>{content}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
