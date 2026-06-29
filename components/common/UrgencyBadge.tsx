import { cn } from '@/lib/utils'
import type { DemandUrgency } from '@/types'

interface UrgencyBadgeProps {
  urgency: DemandUrgency | null | undefined
  className?: string
}

export function UrgencyBadge({ urgency, className }: UrgencyBadgeProps) {
  if (!urgency || urgency === 'normal') {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-50 text-gray-600 border-gray-200',
          className
        )}
      >
        Normal
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-700 border-red-200',
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
      Urgente
    </span>
  )
}
