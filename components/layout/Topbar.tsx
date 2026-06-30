'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell, Menu, LogOut, Settings, ChevronDown, MessageCircle, ArrowRight,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { WHATSAPP_URL, WHATSAPP_MESSAGE } from '@/lib/constants'
import { getInitials, formatDateTime } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { Profile } from '@/types'

const IS_DEMO = !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co') ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')

const DEMO_PREVIEW_NOTIFS = [
  {
    id: 'n1', icon: '🔄', title: 'Status atualizado',
    message: 'Audiência — São Paulo/SP mudou para Em Andamento',
    time: '2026-06-15T09:05:00Z', unread: true,
  },
  {
    id: 'n2', icon: '🔄', title: 'Valor definido',
    message: 'Demanda CJE-20240601-0001: R$ 350,00',
    time: '2026-06-15T09:00:00Z', unread: true,
  },
  {
    id: 'n3', icon: '💰', title: 'Nova fatura disponível',
    message: 'FAT-2026-0001 — R$ 530,00. Venc: 30/06',
    time: '2026-06-14T14:00:00Z', unread: true,
  },
  {
    id: 'n4', icon: '📋', title: 'Demanda programada',
    message: 'Audiência — São Paulo/SP programada',
    time: '2026-06-14T10:30:00Z', unread: false,
  },
]

const TYPE_ICONS: Record<string, string> = {
  nova_demanda: '📋',
  status_atualizado: '🔄',
  demanda_concluida: '✅',
  prazo_proximo: '⚠️',
  fatura_gerada: '💰',
  documento_anexado: '📎',
  novo_cadastro: '👤',
  sistema: '🔔',
}

interface PreviewNotif {
  id: string
  icon: string
  title: string
  message: string
  time: string
  unread: boolean
}

interface TopbarProps {
  profile: Profile | null
  isAdmin?: boolean
  onMenuToggle?: () => void
  unreadNotifications?: number
}

export function Topbar({ profile, isAdmin, onMenuToggle, unreadNotifications = 0 }: TopbarProps) {
  const router = useRouter()
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null)
  const [liveNotifs, setLiveNotifs] = useState<PreviewNotif[]>([])
  const [liveUnread, setLiveUnread] = useState(unreadNotifications)

  // Avatar sync (demo + real)
  useEffect(() => {
    if (!profile?.id) return
    try {
      const stored = JSON.parse(localStorage.getItem('cje_demo_avatars') ?? '{}')
      if (stored[profile.id]) setAvatarUrl(stored[profile.id])
    } catch {}

    function onStorage(e: StorageEvent) {
      if (e.key === 'cje_demo_avatars' && profile?.id) {
        try {
          const updated = JSON.parse(e.newValue ?? '{}')
          setAvatarUrl(updated[profile.id] ?? null)
        } catch {}
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [profile?.id])

  // Fetch real notifications from Supabase (only in production mode)
  useEffect(() => {
    if (IS_DEMO || !profile?.id) return

    async function fetchNotifs() {
      try {
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('id')
          .eq('auth_user_id', profile!.id)
          .maybeSingle()

        if (!profileRow?.id) return

        const { data } = await supabase
          .from('notifications')
          .select('id, title, message, type, is_read, created_at')
          .eq('user_id', profileRow.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (data) {
          setLiveNotifs(data.map((n) => ({
            id: n.id,
            icon: TYPE_ICONS[n.type] ?? '🔔',
            title: n.title,
            message: n.message,
            time: n.created_at,
            unread: !n.is_read,
          })))
          setLiveUnread(data.filter((n) => !n.is_read).length)
        }
      } catch {}
    }

    fetchNotifs()
    // Refresh every 30s
    const interval = setInterval(fetchNotifs, 30_000)
    return () => clearInterval(interval)
  }, [profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSignOut() {
    if (IS_DEMO) {
      await fetch('/api/demo-logout', { method: 'POST' })
    } else {
      await supabase.auth.signOut()
    }
    router.push('/login')
    router.refresh()
  }

  const notifHref = isAdmin ? '/admin/notificacoes' : '/cliente/notificacoes'
  const settingsHref = isAdmin ? '/admin/configuracoes' : '/cliente/configuracoes'
  const displayNotifs = IS_DEMO ? DEMO_PREVIEW_NOTIFS : liveNotifs
  const displayUnread = IS_DEMO ? unreadNotifications : liveUnread

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuToggle}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden sm:block">
          <p className="text-xs text-muted-foreground">
            {isAdmin ? 'CJE Express — Painel Administrativo' : 'CJE Express — Painel do Cliente'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {!isAdmin && (
          <a
            href={`${WHATSAPP_URL}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="sm" className="gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 hidden sm:flex">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Atendimento</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-50 sm:hidden">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </a>
        )}

        {/* Notifications dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {displayUnread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {displayUnread > 9 ? '9+' : displayUnread}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificações</span>
              {displayUnread > 0 && (
                <span className="text-xs font-normal text-blue-600">{displayUnread} nova(s)</span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-72 overflow-y-auto">
              {displayNotifs.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  Nenhuma notificação
                </div>
              ) : (
                displayNotifs.map((n) => (
                  <DropdownMenuItem key={n.id} asChild className="p-0">
                    <Link href={notifHref} className="flex gap-3 px-3 py-2.5 cursor-pointer">
                      <span className="text-base flex-shrink-0 mt-0.5">{n.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-xs font-medium truncate ${n.unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {n.title}
                          </p>
                          {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{formatDateTime(n.time)}</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="p-0">
              <Link
                href={notifHref}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Ver todas as notificações
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl ?? undefined} className="object-cover" />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                  {profile ? getInitials(profile.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none">{profile?.name ?? 'Usuário'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{profile?.email}</p>
              </div>
              <ChevronDown className="hidden sm:block h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{profile?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={settingsHref} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
