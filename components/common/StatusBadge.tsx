import { cn } from '@/lib/utils'
import { DEMAND_STATUS_LABELS, DEMAND_STATUS_COLORS } from '@/lib/constants'
import type { DemandStatus } from '@/types'

interface StatusBadgeProps {
  status: DemandStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        DEMAND_STATUS_COLORS[status],
        className
      )}
    >
      {DEMAND_STATUS_LABELS[status]}
    </span>
  )
}
