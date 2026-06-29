import { formatDateTime } from '@/lib/utils'
import { DEMAND_STATUS_LABELS } from '@/lib/constants'
import type { DemandStatus } from '@/types'

interface TimelineEvent {
  status: DemandStatus
  date: string | null
  label?: string
}

interface TimelineProps {
  events: TimelineEvent[]
}

const STATUS_ICONS: Record<DemandStatus, string> = {
  nova_solicitacao: '📋',
  programado: '📅',
  em_andamento: '⚙️',
  concluido: '✅',
  arquivado: '📁',
  cancelado: '❌',
}

export function Timeline({ events }: TimelineProps) {
  const filtered = events.filter((e) => e.date)

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        Nenhum histórico disponível.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {filtered.map((event, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-base">
              {STATUS_ICONS[event.status]}
            </div>
            {i < filtered.length - 1 && (
              <div className="mt-1 w-px flex-1 bg-gray-200 min-h-[1.5rem]" />
            )}
          </div>
          <div className="pb-4">
            <p className="font-medium text-sm text-gray-900">
              {event.label ?? DEMAND_STATUS_LABELS[event.status]}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(event.date)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
