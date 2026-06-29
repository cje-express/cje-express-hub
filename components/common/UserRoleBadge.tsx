import { cn } from '@/lib/utils'
import { USER_ROLE_LABELS } from '@/lib/constants'
import type { UserRole } from '@/types'

interface UserRoleBadgeProps {
  role: UserRole
  className?: string
}

const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN_CJE: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  OPERADOR_CJE: 'bg-blue-100 text-blue-800 border-blue-200',
  ADMIN_CLIENTE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  OPERADOR_CLIENTE: 'bg-gray-100 text-gray-700 border-gray-200',
}

export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        ROLE_COLORS[role],
        className
      )}
    >
      {USER_ROLE_LABELS[role]}
    </span>
  )
}
