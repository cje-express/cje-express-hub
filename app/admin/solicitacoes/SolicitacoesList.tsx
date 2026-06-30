'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Clock, CheckCircle2, XCircle, Eye, User, Mail,
  Phone, MapPin, MessageSquare, ClipboardList, X,
  Search,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

type Tab = 'pendentes' | 'em_analise' | 'concluidos' | 'canceladas'

const TABS: { key: Tab; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'pendentes',   label: 'Pendentes',  icon: Clock,         color: 'text-orange-500' },
  { key: 'em_analise',  label: 'Em Análise', icon: Search,        color: 'text-blue-500' },
  { key: 'concluidos',  label: 'Concluídos', icon: CheckCircle2,  color: 'text-green-500' },
  { key: 'canceladas',  label: 'Canceladas', icon: XCircle,       color: 'text-red-400' },
]

const STATUS_MAP: Record<Tab, string> = {
  pendentes:  'pendente',
  em_analise: 'em_analise',
  concluidos: 'aprovado',
  canceladas: 'recusado',
}

const BADGE: Record<string, string> = {
  pendente:   'bg-orange-100 text-orange-700 border-orange-200',
  em_analise: 'bg-blue-100 text-blue-700 border-blue-200',
  aprovado:   'bg-green-100 text-green-700 border-green-200',
  recusado:   'bg-red-100 text-red-600 border-red-200',
}
const BADGE_LABEL: Record<string, string> = {
  pendente:   'Pendente',
  em_analise: 'Em análise',
  aprovado:   'Concluído',
  recusado:   'Cancelada',
}

interface Props {
  pendentes:  RegistrationRequest[]
  emAnalise:  RegistrationRequest[]
  concluidos: RegistrationRequest[]
  canceladas: RegistrationRequest[]
}

export function SolicitacoesList({ pendentes, emAnalise, concluidos, canceladas }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('pendentes')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [viewing, setViewing] = useState<RegistrationRequest | null>(null)

  // Local state: all requests in one flat list, manipulated optimistically
  const [allItems, setAllItems] = useState<RegistrationRequest[]>([
    ...pendentes,
    ...emAnalise,
    ...concluidos,
    ...canceladas,
  ])

  function getTabItems(t: Tab) {
    return allItems.filter((r) => r.status === STATUS_MAP[t])
  }

  async function updateStatus(req: RegistrationRequest, newStatus: string) {
    setLoadingId(req.id)
    try {
      const res = await fetch(`/api/registration-requests/${req.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const json = await res.json()
        toast.error(json.error ?? 'Erro ao atualizar.')
        return
      }
      // Optimistic: update item in local state
      setAllItems((prev) =>
        prev.map((r) => r.id === req.id ? { ...r, status: newStatus } : r)
      )
      const messages: Record<string, string> = {
        aprovado:   'Cadastro marcado como concluído.',
        em_analise: 'Solicitação movida para Em Análise.',
        recusado:   'Solicitação cancelada.',
        pendente:   'Solicitação movida para Pendentes.',
      }
      toast.success(messages[newStatus] ?? 'Atualizado.')
      // Auto-switch to the tab where the item went
      const tabMap: Record<string, Tab> = {
        aprovado:   'concluidos',
        em_analise: 'em_analise',
        recusado:   'canceladas',
        pendente:   'pendentes',
      }
      if (tabMap[newStatus]) setTab(tabMap[newStatus])
    } catch {
      toast.error('Erro ao atualizar. Tente novamente.')
    } finally {
      setLoadingId(null)
    }
  }

  const items = getTabItems(tab)

  return (
    <>
      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const count = getTabItems(t.key).length
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-gradient-to-r from-[#006497] to-[#094882] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <t.icon className={`h-4 w-4 ${active ? 'text-white' : t.color}`} />
              {t.label}
              {count > 0 && (
                <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? 'bg-white/20 text-white' : 'bg-white text-gray-500 border border-gray-200'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── List ── */}
      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={`Nenhuma solicitação ${TABS.find(t => t.key === tab)?.label.toLowerCase()}`}
          description="As solicitações aparecerão aqui conforme forem recebidas ou movidas."
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
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-semibold text-sm text-gray-900">
                        {req.name || '(não informado)'}
                      </span>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${BADGE[req.status] ?? ''}`}>
                        {BADGE_LABEL[req.status] ?? req.status}
                      </span>
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
                        <p className="line-clamp-1">{req.info}</p>
                      </div>
                    )}

                    <p className="text-[11px] text-muted-foreground/60">
                      Recebido em {formatDateTime(req.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row sm:flex-col gap-2 sm:min-w-[170px]">
                    {/* Visualizar — always visible */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 sm:flex-none gap-1.5"
                      onClick={() => setViewing(req)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Visualizar
                    </Button>

                    {/* Action buttons — depend on current tab */}
                    {tab === 'pendentes' && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1 sm:flex-none bg-gradient-to-r from-[#006497] to-[#094882] text-white hover:opacity-90 gap-1.5"
                          disabled={loadingId === req.id}
                          onClick={() => updateStatus(req, 'em_analise')}
                        >
                          <Search className="h-3.5 w-3.5" />
                          Em análise
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 sm:flex-none gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
                          disabled={loadingId === req.id}
                          onClick={() => updateStatus(req, 'recusado')}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Cancelar
                        </Button>
                      </>
                    )}

                    {tab === 'em_analise' && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1 sm:flex-none bg-gradient-to-r from-[#006497] to-[#094882] text-white hover:opacity-90 gap-1.5"
                          disabled={loadingId === req.id}
                          onClick={() => updateStatus(req, 'aprovado')}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Cadastro concluído
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 sm:flex-none gap-1.5 text-muted-foreground"
                          disabled={loadingId === req.id}
                          onClick={() => updateStatus(req, 'pendente')}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          Voltar pendente
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 sm:flex-none gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
                          disabled={loadingId === req.id}
                          onClick={() => updateStatus(req, 'recusado')}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Cancelar
                        </Button>
                      </>
                    )}

                    {(tab === 'concluidos' || tab === 'canceladas') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-none gap-1.5 text-muted-foreground"
                        disabled={loadingId === req.id}
                        onClick={() => updateStatus(req, 'pendente')}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        Reabrir
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Detail Modal ── */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewing(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#006497] to-[#094882] px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Dados do Solicitante</h2>
                  <p className="text-white/60 text-xs mt-0.5">Solicitação recebida em {formatDateTime(viewing.created_at)}</p>
                </div>
                <button onClick={() => setViewing(null)} className="text-white/70 hover:text-white transition-colors mt-0.5">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${BADGE[viewing.status] ?? ''}`}>
                  {BADGE_LABEL[viewing.status] ?? viewing.status}
                </span>
              </div>

              {/* Fields */}
              <DetailRow icon={User} label="Nome" value={viewing.name || '—'} />
              <DetailRow icon={Mail} label="E-mail" value={viewing.email} href={`mailto:${viewing.email}`} />
              <DetailRow icon={Phone} label="Celular / WhatsApp" value={viewing.phone || '—'} href={viewing.phone ? `https://wa.me/55${viewing.phone.replace(/\D/g, '')}` : undefined} />
              <DetailRow icon={MapPin} label="Comarca" value={viewing.comarca || '—'} />

              {viewing.info && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Informações sobre a Diligência</p>
                  <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{viewing.info}</p>
                  </div>
                </div>
              )}

              {/* Quick actions from modal */}
              <div className="pt-2 flex flex-col gap-2 border-t border-gray-100">
                {viewing.status === 'pendente' && (
                  <Button
                    className="w-full bg-gradient-to-r from-[#006497] to-[#094882] text-white hover:opacity-90 gap-2"
                    onClick={() => { updateStatus(viewing, 'em_analise'); setViewing(null) }}
                  >
                    <Search className="h-4 w-4" />
                    Mover para Em Análise
                  </Button>
                )}
                {(viewing.status === 'pendente' || viewing.status === 'em_analise') && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                    onClick={() => { updateStatus(viewing, 'aprovado'); setViewing(null) }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Marcar como Cadastro Concluído
                  </Button>
                )}
                {(viewing.status === 'pendente' || viewing.status === 'em_analise') && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => { updateStatus(viewing, 'recusado'); setViewing(null) }}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar solicitação
                  </Button>
                )}
                {(viewing.status === 'aprovado' || viewing.status === 'recusado') && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => { updateStatus(viewing, 'pendente'); setViewing(null) }}
                  >
                    <Clock className="h-4 w-4" />
                    Reabrir solicitação
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function DetailRow({
  icon: Icon, label, value, href,
}: { icon: React.ElementType; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 flex-shrink-0">
        <Icon className="h-4 w-4 text-[#006497]" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline font-medium break-all">
            {value}
          </a>
        ) : (
          <p className="text-sm text-gray-800 font-medium">{value}</p>
        )}
      </div>
    </div>
  )
}
