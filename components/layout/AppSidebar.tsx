'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  Shield,
  UserCog,
  MessageCircle,
  Building2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WHATSAPP_URL, WHATSAPP_MESSAGE } from '@/lib/constants'
import type { UserRole } from '@/types'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  superAdminOnly?: boolean
}

const clientNavItems: NavItem[] = [
  { href: '/cliente/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/cliente/demandas', label: 'Demandas', icon: FileText },
  { href: '/cliente/financeiro', label: 'Financeiro', icon: CreditCard },
  { href: '/cliente/equipe', label: 'Equipe', icon: Users },
  { href: '/cliente/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/cliente/configuracoes', label: 'Configurações', icon: Settings },
]

const adminNavItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/admin/demandas', label: 'Demandas', icon: FileText },
  { href: '/admin/clientes', label: 'Clientes', icon: Building2 },
  { href: '/admin/financeiro', label: 'Financeiro', icon: CreditCard },
  { href: '/admin/usuarios', label: 'Usuários', icon: UserCog, superAdminOnly: true },
  { href: '/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/admin/auditoria', label: 'Auditoria', icon: Shield, superAdminOnly: true },
  { href: '/admin/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings, superAdminOnly: true },
]

interface AppSidebarProps {
  isAdmin?: boolean
  userRole?: UserRole
  onClose?: () => void
  isMobile?: boolean
}

export function AppSidebar({ isAdmin = false, userRole, onClose, isMobile }: AppSidebarProps) {
  const pathname = usePathname()
  const isSuperAdmin = userRole === 'SUPER_ADMIN_CJE'

  const navItems = (isAdmin ? adminNavItems : clientNavItems).filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  )

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center justify-center px-5 py-5 border-b border-sidebar-foreground/10">
        <Link href={isAdmin ? '/admin/dashboard' : '/cliente/dashboard'}>
          <img src="/icons/logo-cje-white.png" alt="CJE Express" className="h-20 w-auto mx-auto" />
        </Link>
        {isMobile && (
          <button onClick={onClose} className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? onClose : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-sidebar-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* WhatsApp */}
      {!isAdmin && (
        <div className="px-3 pb-4">
          <a
            href={`${WHATSAPP_URL}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground transition-colors"
          >
            <MessageCircle className="h-4 w-4 flex-shrink-0" />
            Falar com Atendente
          </a>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-sidebar-foreground/10 px-6 py-4">
        <p className="text-[10px] text-sidebar-foreground/30 text-center">
          CJE Express Hub v1.0
        </p>
      </div>
    </aside>
  )
}
