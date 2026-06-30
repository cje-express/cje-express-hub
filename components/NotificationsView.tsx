'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types'

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  nova_demanda:      { icon: '📋', color: 'bg-blue-100 border-blue-200' },
  status_atualizado: { icon: '🔄', color: 'bg-purple-100 border-purple-200' },
  demanda_concluida: { icon: '✅', color: 'bg-green-100 border-green-200' },
  prazo_proximo:     { icon: '⚠️', color: 'bg-amber-100 border-amber-200' },
  fatura_gerada:     { icon: '💰', color: 'bg-emerald-100 border-emerald-200' },
  documento_anexado: { icon: '📎', color: 'bg-gray-100 border-gray-200' },
  novo_cadastro:     { icon: '👤', color: 'bg-indigo-100 border-indigo-200' },
  sistema:           { icon: '🔔', color: 'bg-gray-100 border-gray-200' },
}

function getNotifHref(type: string, isAdmin: boolean): string {
  if (isAdmin) {
    switch (type) {
      case 'novo_cadastro':                                    return '/admin/solicitacoes'
      case 'nova_demanda':
      case 'status_atualizado':
      case 'demanda_concluida':
      case 'prazo_proximo':
      case 'documento_anexado':                               return '/admin/demandas'
      case 'fatura_gerada':                                   return '/admin/financeiro'
      default:                                                return '/admin/notificacoes'
    }
  } else {
    switch (type) {
      case 'nova_demanda':
      case 'status_atualizado':
      case 'demanda_concluida':
      case 'prazo_proximo':
      case 'documento_anexado':                               return '/cliente/demandas'
      case 'fatura_gerada':                                   return '/cliente/financeiro'
      default:                                                return '/cliente/notificacoes'
    }
  }
}

interface Props {
  notifications: Notification[]
  isAdmin?: boolean
}

export function NotificationsView({ notifications: initial, isAdmin = false }: Props) {
  const [items, setItems] = useState(initial)
  const router = useRouter()

  const unread = items.filter((n) => !n.is_read)
  const read   = items.filter((n) =>  n.is_read)

  async function markAsRead(id: string) {
    // Optimistic update
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    } catch {}
  }

  async function markAllRead() {
    const unreadIds = items.filter((n) => !n.is_read).map((n) => n.id)
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
    try {
      await Promise.all(unreadIds.map((id) => fetch(`/api/notifications/${id}`, { method: 'PATCH' })))
      toast.success('Todas as notificações marcadas como lidas.')
    } catch {}
  }

  async function handleClick(notif: Notification) {
    await markAsRead(notif.id)
    const href = getNotifHref(notif.type, isAdmin)
    router.push(href)
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
        <EmptyState icon={Bell} title="Nenhuma notificação" description="Suas notificações aparecerão aqui." />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unread.length > 0 ? `${unread.length} não lida(s)` : 'Todas lidas'}
          </p>
        </div>
        {unread.length > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Seção: Não lidas */}
      {unread.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 px-1">
            Não lidas — {unread.length}
          </p>
          {unread.map((notif) => (
            <NotifCard key={notif.id} notif={notif} onClick={() => handleClick(notif)} />
          ))}
        </div>
      )}

      {/* Seção: Lidas */}
      {read.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1">
            Lidas — {read.length}
          </p>
          {read.map((notif) => (
            <NotifCard key={notif.id} notif={notif} onClick={() => handleClick(notif)} />
          ))}
        </div>
      )}
    </div>
  )
}

function NotifCard({ notif, onClick }: { notif: Notification; onClick: () => void }) {
  const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.sistema

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md cursor-pointer',
        !notif.is_read && 'border-blue-300 bg-blue-50/30 shadow-sm'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex gap-3">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 text-lg border',
          config.color
        )}>
          {config.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={cn('text-sm font-medium', !notif.is_read ? 'text-gray-900' : 'text-gray-600')}>
              {notif.title}
            </p>
            {!notif.is_read && (
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1 animate-pulse" />
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
          <p className="text-xs text-gray-400 mt-1.5">{formatDateTime(notif.created_at)}</p>
        </div>
      </CardContent>
    </Card>
  )
}
