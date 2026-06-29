'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/common/StatusBadge'
import { UrgencyBadge } from '@/components/common/UrgencyBadge'
import { formatDate } from '@/lib/utils'
import { DEMAND_TYPE_LABELS, DEMAND_STATUS_LABELS } from '@/lib/constants'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  AlertCircle,
} from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Demand } from '@/types'

interface CalendarViewProps {
  demands: Demand[]
  basePath: string
}

const STATUS_DOT_COLORS: Record<string, string> = {
  nova_solicitacao: 'bg-blue-500',
  programado: 'bg-purple-500',
  em_andamento: 'bg-amber-500',
  concluido: 'bg-green-500',
  arquivado: 'bg-gray-400',
  cancelado: 'bg-red-400',
}

const WEEKDAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export function CalendarView({ demands, basePath }: CalendarViewProps) {
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(now)
  const [filterFrom, setFilterFrom] = useState(
    format(startOfMonth(now), 'yyyy-MM-dd')
  )
  const [filterTo, setFilterTo] = useState(
    format(endOfMonth(now), 'yyyy-MM-dd')
  )
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const handleFilter = () => {
    if (filterFrom) {
      const fromDate = parseISO(filterFrom)
      setCurrentMonth(fromDate)
    }
  }

  const handlePrevMonth = () => {
    const prev = subMonths(currentMonth, 1)
    setCurrentMonth(prev)
    setFilterFrom(format(startOfMonth(prev), 'yyyy-MM-dd'))
    setFilterTo(format(endOfMonth(prev), 'yyyy-MM-dd'))
    setSelectedDay(null)
  }

  const handleNextMonth = () => {
    const next = addMonths(currentMonth, 1)
    setCurrentMonth(next)
    setFilterFrom(format(startOfMonth(next), 'yyyy-MM-dd'))
    setFilterTo(format(endOfMonth(next), 'yyyy-MM-dd'))
    setSelectedDay(null)
  }

  // Build a map of date -> demands
  const demandsByDate = useMemo(() => {
    const map: Record<string, Demand[]> = {}
    for (const demand of demands) {
      // Use deadline_date as primary, fallback to created_at
      const dateStr = demand.deadline_date ?? demand.created_at
      if (!dateStr) continue
      const dayKey = dateStr.substring(0, 10) // 'yyyy-MM-dd'
      if (!map[dayKey]) map[dayKey] = []
      map[dayKey].push(demand)
    }
    return map
  }, [demands])

  // Demands with no date at all (shouldn't normally happen but handle gracefully)
  const demandsNoDate = useMemo(
    () => demands.filter((d) => !d.deadline_date && !d.created_at),
    [demands]
  )

  // Demands whose deadline_date is null (shown in "Sem prazo" section)
  const demandsNoDeadline = useMemo(
    () => demands.filter((d) => !d.deadline_date),
    [demands]
  )

  // Calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Get demands for the selected day
  const selectedDayDemands = useMemo(() => {
    if (!selectedDay) return []
    const key = format(selectedDay, 'yyyy-MM-dd')
    return demandsByDate[key] ?? []
  }, [selectedDay, demandsByDate])

  return (
    <div className="space-y-4">
      {/* Date filter and month navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">De</label>
          <Input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="h-8 text-xs w-36"
          />
          <label className="text-xs text-gray-500 font-medium">Até</label>
          <Input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="h-8 text-xs w-36"
          />
          <Button size="sm" variant="outline" onClick={handleFilter} className="h-8 text-xs">
            Filtrar
          </Button>
        </div>

        <div className="flex items-center gap-1 sm:ml-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrevMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-gray-700 min-w-[140px] text-center capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleNextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-lg border bg-white overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {WEEKDAY_HEADERS.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd')
            const dayDemands = demandsByDate[dayKey] ?? []
            const inMonth = isSameMonth(day, currentMonth)
            const today = isToday(day)
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`
                  relative min-h-[72px] border-b border-r p-1.5 text-left transition-colors
                  ${!inMonth ? 'bg-gray-50/50' : 'bg-white hover:bg-blue-50/30'}
                  ${isSelected ? 'bg-blue-50 ring-2 ring-inset ring-blue-500' : ''}
                  ${today && !isSelected ? 'ring-2 ring-inset ring-blue-500' : ''}
                `}
              >
                <span
                  className={`
                    text-xs font-medium
                    ${!inMonth ? 'text-gray-300' : today ? 'text-blue-600 font-bold' : 'text-gray-700'}
                  `}
                >
                  {format(day, 'd')}
                </span>

                {dayDemands.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {dayDemands.length <= 4 ? (
                      dayDemands.map((d) => (
                        <span
                          key={d.id}
                          className={`h-2 w-2 rounded-full ${STATUS_DOT_COLORS[d.status] ?? 'bg-gray-400'}`}
                          title={`${d.protocol_number} — ${DEMAND_STATUS_LABELS[d.status]}`}
                        />
                      ))
                    ) : (
                      <>
                        {dayDemands.slice(0, 3).map((d) => (
                          <span
                            key={d.id}
                            className={`h-2 w-2 rounded-full ${STATUS_DOT_COLORS[d.status] ?? 'bg-gray-400'}`}
                          />
                        ))}
                        <span className="text-[9px] leading-none text-gray-500 font-medium ml-0.5">
                          +{dayDemands.length - 3}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day details */}
      {selectedDay && (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-500" />
            Demandas em {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}
            <span className="text-xs text-gray-400 font-normal">
              ({selectedDayDemands.length})
            </span>
          </h3>

          {selectedDayDemands.length === 0 ? (
            <p className="text-xs text-gray-400">Nenhuma demanda neste dia.</p>
          ) : (
            <div className="space-y-2">
              {selectedDayDemands.map((demand) => (
                <Link
                  key={demand.id}
                  href={`${basePath}/${demand.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono text-gray-400">
                        {demand.protocol_number}
                      </span>
                      <UrgencyBadge urgency={demand.urgency} className="scale-90" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {DEMAND_TYPE_LABELS[demand.demand_type]}
                    </p>
                    <p className="text-xs text-gray-500">
                      {demand.city}/{demand.state}
                    </p>
                  </div>
                  <StatusBadge status={demand.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Demands with no deadline */}
      {demandsNoDeadline.length > 0 && (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-gray-400" />
            Sem prazo definido
            <span className="text-xs text-gray-400 font-normal">
              ({demandsNoDeadline.length})
            </span>
          </h3>
          <div className="space-y-2">
            {demandsNoDeadline.map((demand) => (
              <Link
                key={demand.id}
                href={`${basePath}/${demand.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-gray-400">
                      {demand.protocol_number}
                    </span>
                    <UrgencyBadge urgency={demand.urgency} className="scale-90" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {DEMAND_TYPE_LABELS[demand.demand_type]}
                  </p>
                  <p className="text-xs text-gray-500">
                    {demand.city}/{demand.state}
                    <span className="text-gray-300 ml-2">
                      Criada: {formatDate(demand.created_at)}
                    </span>
                  </p>
                </div>
                <StatusBadge status={demand.status} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
