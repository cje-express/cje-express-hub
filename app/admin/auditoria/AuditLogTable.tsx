'use client'

import { useState } from 'react'
import { Shield, Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDateTime } from '@/lib/utils'

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  login:          { label: '🔐 Login',             color: 'bg-gray-100 text-gray-700' },
  create:         { label: '✅ Criação',            color: 'bg-green-50 text-green-700' },
  update:         { label: '✏️ Edição',             color: 'bg-blue-50 text-blue-700' },
  delete:         { label: '🗑️ Exclusão',           color: 'bg-red-50 text-red-700' },
  status_change:  { label: '🔄 Mudança de status',  color: 'bg-purple-50 text-purple-700' },
  cancel:         { label: '❌ Cancelamento',        color: 'bg-red-50 text-red-700' },
  archive:        { label: '📁 Arquivamento',        color: 'bg-gray-100 text-gray-700' },
  upload:         { label: '📎 Upload',              color: 'bg-amber-50 text-amber-700' },
  invoice_create: { label: '💰 Fatura gerada',      color: 'bg-emerald-50 text-emerald-700' },
  invoice_paid:   { label: '✅ Pagamento confirmado', color: 'bg-green-50 text-green-700' },
}

const ENTITY_LABELS: Record<string, string> = {
  demands: 'Demanda',
  organizations: 'Cliente',
  profiles: 'Usuário',
  invoices: 'Fatura',
  demand_attachments: 'Documento',
}

interface AuditLogTableProps {
  logs: any[]
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')

  const filtered = logs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false
    if (entityFilter !== 'all' && log.entity_type !== entityFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        log.description?.toLowerCase().includes(q) ||
        log.user?.name?.toLowerCase().includes(q) ||
        log.user?.email?.toLowerCase().includes(q) ||
        log.entity_id?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const hasFilters = search || actionFilter !== 'all' || entityFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setActionFilter('all')
    setEntityFilter('all')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Auditoria</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {filtered.length} de {logs.length} registro(s) — Log completo de ações na plataforma
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descrição, usuário..."
            className="pl-9 h-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px] h-9">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
            <SelectValue placeholder="Tipo de ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Entidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(ENTITY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-gray-500">
            <X className="h-3.5 w-3.5" /> Limpar
          </Button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="Nenhum registro encontrado"
          description={hasFilters ? 'Tente ajustar os filtros.' : 'As ações realizadas na plataforma serão registradas aqui.'}
        />
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[160px]">Data/Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[180px]">Usuário</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[160px]">Ação</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[100px]">Entidade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((log: any) => {
                  const actionMeta = ACTION_LABELS[log.action] ?? { label: log.action, color: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600 whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-gray-800 truncate max-w-[160px]">{log.user?.name ?? '—'}</p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{log.user?.email ?? ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${actionMeta.color}`}>
                          {actionMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600">
                          {ENTITY_LABELS[log.entity_type] ?? log.entity_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {log.description ?? '—'}
                        </p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
