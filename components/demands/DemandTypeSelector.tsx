'use client'

import { cn } from '@/lib/utils'
import { DEMAND_TYPES } from '@/lib/constants'
import type { DemandType } from '@/types'

interface DemandTypeSelectorProps {
  value: DemandType | null
  onChange: (type: DemandType) => void
}

export function DemandTypeSelector({ value, onChange }: DemandTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {DEMAND_TYPES.map((type) => (
        <button
          key={type.value}
          type="button"
          onClick={() => onChange(type.value)}
          className={cn(
            'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all hover:border-blue-300 hover:bg-blue-50',
            value === type.value
              ? 'border-blue-600 bg-blue-50 shadow-sm'
              : 'border-gray-200 bg-white'
          )}
        >
          <span className="text-2xl">{type.icon}</span>
          <span
            className={cn(
              'text-sm font-medium',
              value === type.value ? 'text-blue-700' : 'text-gray-700'
            )}
          >
            {type.label}
          </span>
        </button>
      ))}
    </div>
  )
}
