'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  ClipboardList, CheckCircle2, XCircle, Clock, Mail,
  Phone, MapPin, MessageSquare, User,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDateTime } from '@/lib/utils'

interface RegistrationRequest {
  id: string
  name: string | null
  email: string
  phone: string | null
  comarca: string | null
  info: string | null
  status: string
  created_at: string
}

interface Props {
  pendentes: RegistrationRequest[]
  concluidos: RegistrationRequest[]
}

export function SolicitacoesList({ pendentes, concluidos }: Props) {
  const [tab, setTab] = useState<'pendentes' | 'concluidos'>('pendentes')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const router = useRouter()

  async function updateStatus(id: string, status: 'aprovado' | 'recusado' | 'em_analise') {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/registration-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const json = await res.json()
        toast.error(json.error ?? 'Erro ao atualizar.')
        return
      }
      toast.success(
        status === 'aprovado' ? 'Cadastro concluído!' :
        status === 'recusado' ? 'Solicitação recusada.' :
        'Marcado como em análise.'
      )
      router.refresh()
    } catch {
      toast.error('Erro ao atualizar. Tente novamente.')
    } finally {
      setLoadingId(null)
    }
  }

  const items = tab === 'pendentes' ? pendentes : concluidos

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('pendentes')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'pendentes'
              ? 'bg-gradient-to-r from-[#006497] to-[#094882] text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Clock className="h-4 w-4" />
          Pendentes
          {pendentes.length > 0 && (
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              tab === 'pendentes' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
            }`}>
              {pendentes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('concluidos')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'concluidos'
              ? 'bg-gradient-to-r from-[#006497] to-[#094882] text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Concluídos
          {concluidos.length > 0 && (
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              tab === 'concluidos' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {concluidos.length}
            </span>
          )}
        </button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={tab === 'pendentes' ? 'Nenhuma solicitação pendente' : 'Nenhuma solicitação concluída'}
          description={
            tab === 'pendentes'
              ? 'Novas solicitações da landing page aparecerão aqui.'
              : 'Solicitações aprovadas ou recusadas aparecerão aqui.'
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((req) => (
            <Card key={req.id} className="border border-border">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Info */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-semibold text-sm text-gray-900">
                          {req.name || '(não informado)'}
                        </span>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                        <a href={`mailto:${req.email}`} className="hover:text-blue-600 truncate">{req.email}</a>
                      </div>
                      {req.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{req.phone}</span>
                        </div>
                      )}
                      {req.comarca && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{req.comarca}</span>
                        </div>
                      )}
                    </div>

                    {req.info && (
                      <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                        <p className="line-clamp-2">{req.info}</p>
                      </div>
                    )}

                    <p className="text-[11px] text-muted-foreground/60">
                      Recebido em {formatDateTime(req.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  {tab === 'pendentes' && (
                    <div className="flex flex-row sm:flex-col gap-2 sm:min-w-[160px]">
                      <Button
                        size="sm"
                        className="flex-1 sm:flex-none bg-gradient-to-r from-[#006497] to-[#094882] text-white hover:opacity-90 gap-1.5"
                        disabled={loadingId === req.id}
                        onClick={() => updateStatus(req.id, 'aprovado')}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Cadastro concluído
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-none gap-1.5 text-muted-foreground hover:text-gray-700"
                        disabled={loadingId === req.id}
                        onClick={() => updateStatus(req.id, 'em_analise')}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        Em análise
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 sm:flex-none gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
                        disabled={loadingId === req.id}
                        onClick={() => updateStatus(req.id, 'recusado')}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Recusar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pendente: { label: 'Pendente', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    em_analise: { label: 'Em análise', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    aprovado: { label: 'Cadastro concluído', className: 'bg-green-100 text-green-700 border-green-200' },
    recusado: { label: 'Recusado', className: 'bg-red-100 text-red-700 border-red-200' },
  }
  const s = map[status] ?? { label: status, className: 'bg-gray-100 text-gray-600 border-gray-200' }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${s.className}`}>
      {s.label}
    </span>
  )
}
