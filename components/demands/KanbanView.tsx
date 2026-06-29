'use client'

import Link from 'next/link'
import { UrgencyBadge } from '@/components/common/UrgencyBadge'
import { formatDate, isDeadlineNear } from '@/lib/utils'
import { DEMAND_TYPE_LABELS, DEMAND_STATUS_LABELS } from '@/lib/constants'
import { Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { Demand, DemandStatus } from '@/types'

interface KanbanViewProps {
  demands: Demand[]
  basePath: string
}

const ACTIVE_COLUMNS: { status: DemandStatus; color: string; borderColor: string }[] = [
  { status: 'nova_solicitacao', color: 'bg-blue-500', borderColor: 'border-blue-500' },
  { status: 'programado', color: 'bg-purple-500', borderColor: 'border-purple-500' },
  { status: 'em_andamento', color: 'bg-amber-500', borderColor: 'border-amber-500' },
  { status: 'concluido', color: 'bg-green-500', borderColor: 'border-green-500' },
]

const INACTIVE_COLUMNS: { status: DemandStatus; color: string; borderColor: string }[] = [
  { status: 'arquivado', color: 'bg-gray-400', borderColor: 'border-gray-400' },
  { status: 'cancelado', color: 'bg-red-400', borderColor: 'border-red-400' },
]

export function KanbanView({ demands, basePath }: KanbanViewProps) {
  const [showInactive, setShowInactive] = useState(false)

  const grouped = demands.reduce<Record<string, Demand[]>>((acc, d) => {
    if (!acc[d.status]) acc[d.status] = []
    acc[d.status].push(d)
    return acc
  }, {})

  const inactiveCount =
    (grouped['arquivado']?.length ?? 0) + (grouped['cancelado']?.length ?? 0)

  return (
    <div className="space-y-4">
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
        {ACTIVE_COLUMNS.map(({ status, color, borderColor }) => (
          <KanbanColumn
            key={status}
            status={status}
            demands={grouped[status] ?? []}
            basePath={basePath}
            color={color}
            borderColor={borderColor}
          />
        ))}
      </div>

      {inactiveCount > 0 && (
        <div>
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showInactive ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Arquivados e Cancelados ({inactiveCount})
          </button>

          {showInactive && (
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 mt-3">
              {INACTIVE_COLUMNS.map(({ status, color, borderColor }) => {
                const items = grouped[status] ?? []
                if (items.length === 0) return null
                return (
                  <KanbanColumn
                    key={status}
                    status={status}
                    demands={items}
                    basePath={basePath}
                    color={color}
                    borderColor={borderColor}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function KanbanColumn({
  status,
  demands,
  basePath,
  color,
  borderColor,
}: {
  status: DemandStatus
  demands: Demand[]
  basePath: string
  color: string
  borderColor: string
}) {
  return (
    <div className={`min-w-[280px] flex-1 rounded-lg bg-gray-50 border-t-[3px] ${borderColor}`}>
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
          <span className="text-sm font-semibold text-gray-700">
            {DEMAND_STATUS_LABELS[status]}
          </span>
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-200 rounded-full px-2 py-0.5">
          {demands.length}
        </span>
      </div>

      <div className="p-2 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
        {demands.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">Nenhuma demanda</p>
        ) : (
          demands.map((demand) => (
            <KanbanCard key={demand.id} demand={demand} basePath={basePath} />
          ))
        )}
      </div>
    </div>
  )
}

function KanbanCard({ demand, basePath }: { demand: Demand; basePath: string }) {
  const nearDeadline = isDeadlineNear(demand.deadline_date, demand.status)

  return (
    <Link href={`${basePath}/${demand.id}`}>
      <div
        className={`rounded-lg bg-white border p-3 hover:shadow-md transition-shadow cursor-pointer ${
          nearDeadline ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-mono text-gray-400 font-medium">
            {demand.protocol_number}
          </span>
          <UrgencyBadge urgency={demand.urgency} className="scale-90 origin-right" />
        </div>

        <p className="text-sm font-medium text-gray-900 mb-1">
          {DEMAND_TYPE_LABELS[demand.demand_type]}
        </p>

        <p className="text-xs text-gray-500 mb-2">
          {demand.city}/{demand.state}
        </p>

        {demand.organization?.name && (
          <p className="text-xs text-gray-400 truncate mb-2">
            {demand.organization.name}
          </p>
        )}

        {demand.deadline_date && (
          <div
            className={`flex items-center gap-1 text-xs ${
              nearDeadline ? 'text-amber-600 font-medium' : 'text-gray-400'
            }`}
          >
            <Clock className="h-3 w-3" />
            {nearDeadline && '⚠ '}
            {formatDate(demand.deadline_date)}
          </div>
        )}
      </div>
    </Link>
  )
}
