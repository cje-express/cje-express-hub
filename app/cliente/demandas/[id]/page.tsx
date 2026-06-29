import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, MapPin, Calendar, User, FileText, AlertCircle } from 'lucide-react'
import { getServerProfile } from '@/lib/server-session'
import { IS_DEMO_MODE, DEMO_DEMANDS } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { UrgencyBadge } from '@/components/common/UrgencyBadge'
import { Timeline } from '@/components/demands/Timeline'
import { AttachmentList } from '@/components/demands/AttachmentList'
import { WhatsAppButton } from '@/components/common/WhatsAppButton'
import { ClientDemandActions } from '@/components/demands/ClientDemandActions'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils'
import {
  DEMAND_TYPE_LABELS,
  HEARING_AREA_LABELS,
  HEARING_TYPE_LABELS,
  HEARING_FORMAT_LABELS,
  REQUIRED_PROFESSIONAL_LABELS,
  BILLING_TYPE_LABELS,
} from '@/lib/constants'
import type { Demand, DemandAudienceDetails, DemandAttachment } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClienteDemandaDetailPage({ params }: Props) {
  const { id } = await params
  const profile = await getServerProfile()

  let d: Demand
  let audience: DemandAudienceDetails | null = null
  let files: DemandAttachment[] = []

  if (IS_DEMO_MODE) {
    const found = DEMO_DEMANDS.find(
      (dm) => dm.id === id && dm.organization_id === profile.organization_id
    )
    if (!found) notFound()
    d = found
  } else {
    const supabase = await createClient()

    const { data: demand } = await supabase
      .from('demands')
      .select('*')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)
      .single()

    if (!demand) notFound()

    d = demand as Demand

    const [{ data: audienceDetails }, { data: attachments }] = await Promise.all([
      supabase
        .from('demand_audience_details')
        .select('*')
        .eq('demand_id', id)
        .single(),
      supabase
        .from('demand_attachments')
        .select('*')
        .eq('demand_id', id)
        .eq('visibility', 'client_and_admin')
        .order('created_at', { ascending: false }),
    ])

    audience = audienceDetails as DemandAudienceDetails | null
    files = (attachments as DemandAttachment[]) ?? []
  }

  const timelineEvents = [
    { status: 'nova_solicitacao' as const, date: d.created_at, label: 'Solicitação criada' },
    { status: 'programado' as const, date: d.scheduled_at, label: 'Demanda programada' },
    { status: 'em_andamento' as const, date: d.started_at, label: 'Execução iniciada' },
    { status: 'concluido' as const, date: d.completed_at, label: 'Demanda concluída' },
    { status: 'cancelado' as const, date: d.canceled_at, label: 'Demanda cancelada' },
    { status: 'arquivado' as const, date: d.archived_at, label: 'Demanda arquivada' },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/cliente/demandas">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono text-gray-400">{d.protocol_number}</span>
            <StatusBadge status={d.status} />
            <UrgencyBadge urgency={d.urgency} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            {DEMAND_TYPE_LABELS[d.demand_type]}
            {d.other_demand_type && ` — ${d.other_demand_type}`}
          </h1>
        </div>
        <WhatsAppButton variant="compact" label="Atendimento" />
      </div>

      {/* Status info */}
      {d.status === 'cancelado' && d.cancel_reason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 text-sm">Demanda cancelada</p>
            <p className="text-red-700 text-sm mt-0.5">{d.cancel_reason}</p>
          </div>
        </div>
      )}

      {d.status === 'concluido' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 text-sm">
          Demanda concluída. Os documentos finais estão disponíveis para download abaixo.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Dados principais */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dados da Solicitação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={MapPin} label="Local">
                {d.city}/{d.state}
                {d.service_location && (
                  <span className="block text-xs text-gray-400 mt-0.5">{d.service_location}</span>
                )}
              </InfoRow>

              {d.deadline_date && (
                <InfoRow icon={Calendar} label="Prazo">
                  {formatDate(d.deadline_date)}
                  {d.deadline_time && ` às ${d.deadline_time.substring(0, 5)}`}
                </InfoRow>
              )}

              {d.process_number && (
                <InfoRow icon={FileText} label="Processo">
                  {d.process_number}
                </InfoRow>
              )}

              {d.required_professional && (
                <InfoRow icon={User} label="Profissional">
                  {REQUIRED_PROFESSIONAL_LABELS[d.required_professional]}
                </InfoRow>
              )}

              {d.billing_type && (
                <InfoRow icon={FileText} label="Cobrança">
                  {BILLING_TYPE_LABELS[d.billing_type]}
                </InfoRow>
              )}

              {d.service_value != null && (
                <InfoRow icon={FileText} label="Valor">
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(d.service_value)}
                  </span>
                </InfoRow>
              )}
            </CardContent>
          </Card>

          {/* Detalhes de audiência */}
          {audience && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Dados da Audiência</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Área">{HEARING_AREA_LABELS[audience.hearing_area]}</InfoRow>
                <InfoRow label="Tipo">{HEARING_TYPE_LABELS[audience.hearing_type]}</InfoRow>
                <InfoRow label="Formato">{HEARING_FORMAT_LABELS[audience.hearing_format]}</InfoRow>
                {audience.hearing_datetime && (
                  <InfoRow label="Data/Hora">{formatDateTime(audience.hearing_datetime)}</InfoRow>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instruções */}
          {d.instructions && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Instruções</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{d.instructions}</p>
              </CardContent>
            </Card>
          )}

          {/* Anexos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Documentos ({files.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <AttachmentList attachments={files} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Timeline */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Histórico de Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={timelineEvents} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Criada em</p>
              <p className="text-sm text-gray-500">{formatDateTime(d.created_at)}</p>
            </CardContent>
          </Card>

          {d.status !== 'cancelado' && d.status !== 'arquivado' && (
            <ClientDemandActions demandId={d.id} currentNotes={d.client_notes} />
          )}

          <WhatsAppButton variant="default" className="w-full" label="Falar com Atendente" />
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon?: React.ElementType
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />}
      <div className={!Icon ? 'pl-7' : ''}>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <div className="text-sm text-gray-700 mt-0.5">{children}</div>
      </div>
    </div>
  )
}
