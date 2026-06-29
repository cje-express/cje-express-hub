'use client'

import { useState } from 'react'
import { LayoutList, Columns3, CalendarDays } from 'lucide-react'
import { ListView } from './ListView'
import { KanbanView } from './KanbanView'
import { CalendarView } from './CalendarView'
import type { Demand } from '@/types'

type ViewMode = 'list' | 'kanban' | 'calendar'

interface DemandsViewSwitcherProps {
  demands: Demand[]
  basePath: string
  isAdmin?: boolean
}

const VIEW_OPTIONS: { key: ViewMode; label: string; Icon: typeof LayoutList }[] = [
  { key: 'list', label: 'Lista', Icon: LayoutList },
  { key: 'kanban', label: 'Kanban', Icon: Columns3 },
  { key: 'calendar', label: 'Calendário', Icon: CalendarDays },
]

export function DemandsViewSwitcher({
  demands,
  basePath,
  isAdmin,
}: DemandsViewSwitcherProps) {
  const [view, setView] = useState<ViewMode>('list')

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {VIEW_OPTIONS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${
                view === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-transparent text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Active view */}
      {view === 'list' && (
        <ListView demands={demands} basePath={basePath} isAdmin={isAdmin} />
      )}
      {view === 'kanban' && (
        <KanbanView demands={demands} basePath={basePath} />
      )}
      {view === 'calendar' && (
        <CalendarView demands={demands} basePath={basePath} />
      )}
    </div>
  )
}
