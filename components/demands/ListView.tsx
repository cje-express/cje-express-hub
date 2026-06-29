'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { UrgencyBadge } from '@/components/common/UrgencyBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate, formatCurrency, isDeadlineNear } from '@/lib/utils'
import { DEMAND_TYPE_LABELS } from '@/lib/constants'
import { FileText } from 'lucide-react'
import type { Demand } from '@/types'

interface ListViewProps {
  demands: Demand[]
  basePath: string
  isAdmin?: boolean
}

export function ListView({ demands, basePath, isAdmin }: ListViewProps) {
  if (demands.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nenhuma demanda encontrada"
        description="Nenhuma demanda corresponde aos critérios atuais."
      />
    )
  }

  if (isAdmin) {
    return <AdminTable demands={demands} basePath={basePath} />
  }

  return <ClientCards demands={demands} basePath={basePath} />
}

function ClientCards({ demands, basePath }: { demands: Demand[]; basePath: string }) {
  return (
    <div className="space-y-3">
      {demands.map((demand) => (
        <Card key={demand.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-mono text-gray-400 font-medium">
                    {demand.protocol_number}
                  </span>
                  <UrgencyBadge urgency={demand.urgency} />
                </div>
                <p className="font-semibold text-gray-900">
                  {DEMAND_TYPE_LABELS[demand.demand_type]}
                  {demand.other_demand_type && ` — ${demand.other_demand_type}`}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {demand.city}/{demand.state}
                  {demand.service_location && ` · ${demand.service_location}`}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>Criada: {formatDate(demand.created_at)}</span>
                  {demand.deadline_date && (
                    <span>Prazo: {formatDate(demand.deadline_date)}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <StatusBadge status={demand.status} />
                <Link href={`${basePath}/${demand.id}`}>
                  <Button variant="outline" size="sm">Ver detalhes</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AdminTable({ demands, basePath }: { demands: Demand[]; basePath: string }) {
  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Protocolo</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Cliente</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo / Local</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Prazo</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Valor</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {demands.map((demand) => {
            const nearDeadline = isDeadlineNear(demand.deadline_date, demand.status)
            return (
              <tr
                key={demand.id}
                className={`hover:bg-gray-50 transition-colors ${nearDeadline ? 'bg-amber-50/30' : ''}`}
              >
                <td className="px-4 py-3">
                  <div>
                    <span className="font-mono text-xs text-gray-600 font-medium">
                      {demand.protocol_number}
                    </span>
                    <div className="mt-1">
                      <UrgencyBadge urgency={demand.urgency} className="scale-90 origin-left" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p className="text-xs text-gray-600 max-w-[120px] truncate">
                    {demand.organization?.name}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 text-xs">
                    {DEMAND_TYPE_LABELS[demand.demand_type]}
                  </p>
                  <p className="text-xs text-gray-400">{demand.city}/{demand.state}</p>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {demand.deadline_date ? (
                    <span className={`text-xs ${nearDeadline ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                      {nearDeadline && '⚠ '}
                      {formatDate(demand.deadline_date)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {demand.service_value != null ? (
                    <span className="text-xs font-medium text-gray-700">
                      {formatCurrency(demand.service_value)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">Não definido</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={demand.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`${basePath}/${demand.id}`}>
                    <Button size="sm" variant="outline">Gerenciar</Button>
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
