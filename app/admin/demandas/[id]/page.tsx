'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ChevronLeft,
  Save,
  Loader2,
  AlertTriangle,
  Archive,
  XCircle,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/common/StatusBadge'
import { UrgencyBadge } from '@/components/common/UrgencyBadge'
import { Timeline } from '@/components/demands/Timeline'
import { AttachmentList } from '@/components/demands/AttachmentList'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { createClient } from '@/lib/supabase/client'
import { IS_DEMO_MODE, DEMO_DEMANDS } from '@/lib/demo'
import {
  DEMAND_STATUS_LABELS,
  DEMAND_TYPE_LABELS,
  REQUIRED_PROFESSIONAL_LABELS,
  BRAZIL_STATES,
} from '@/lib/constants'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import type { Demand, DemandStatus, DemandAttachment, DemandAudienceDetails } from '@/types'

export default function AdminDemandaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const id = params.id as string

  const [demand, setDemand] = useState<Demand | null>(null)
  const [audience, setAudience] = useState<DemandAudienceDetails | null>(null)
  const [attachments, setAttachments] = useState<DemandAttachment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<{ id: string; role: string } | null>(null)

  // Edit state
  const [adminNotes, setAdminNotes] = useState('')
  const [serviceValue, setServiceValue] = useState('')
  const [status, setStatus] = useState<DemandStatus>('nova_solicitacao')
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)

  useEffect(() => {
    async function load() {
      if (IS_DEMO_MODE) {
        setProfile({ id: 'demo-admin-001', role: 'SUPER_ADMIN_CJE' })
        const found = DEMO_DEMANDS.find((dm) => dm.id === id)
        if (!found) { toast.error('Demanda não encontrada'); router.back(); return }
        setDemand({
          ...found,
          organization: { name: 'Escritório Demo Advogados', email: 'contato@demo-adv.com.br', phone: '(11) 3333-4444' } as any,
          created_by: { name: 'João Demo Silva', email: 'cliente@teste.com.br' } as any,
        } as Demand)
        setAdminNotes(found.admin_notes ?? '')
        setServiceValue(found.service_value?.toString() ?? '')
        setStatus(found.status)
        setIsLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single()
      setProfile(prof)

      const { data: d } = await supabase
        .from('demands')
        .select(`
          *,
          organization:organizations(name, email, phone),
          created_by:profiles!demands_created_by_user_id_fkey(name, email)
        `)
        .eq('id', id)
        .single()

      if (!d) { toast.error('Demanda não encontrada'); router.back(); return }

      setDemand(d as Demand)
      setAdminNotes(d.admin_notes ?? '')
      setServiceValue(d.service_value?.toString() ?? '')
      setStatus(d.status)

      const { data: aud } = await supabase
        .from('demand_audience_details')
        .select('*')
        .eq('demand_id', id)
        .single()
      setAudience(aud as DemandAudienceDetails | null)

      const { data: att } = await supabase
        .from('demand_attachments')
        .select('*, uploaded_by:profiles(name)')
        .eq('demand_id', id)
        .order('created_at', { ascending: false })
      setAttachments((att as DemandAttachment[]) ?? [])

      setIsLoading(false)
    }
    load()
  }, [id])

  const isSuperAdmin = profile?.role === 'SUPER_ADMIN_CJE'

  async function handleSave() {
    if (!demand || !isSuperAdmin) return
    setIsSaving(true)
    try {
      const updates: Partial<Demand> = {
        admin_notes: adminNotes || null,
        service_value: serviceValue ? parseFloat(serviceValue.replace(',', '.')) : null,
        is_value_confirmed_externally: !!serviceValue,
      }

      if (status !== demand.status) {
        updates.status = status
        if (status === 'programado') updates.scheduled_at = new Date().toISOString()
        if (status === 'em_andamento') updates.started_at = new Date().toISOString()
        if (status === 'concluido') updates.completed_at = new Date().toISOString()
      }

      const { error } = await supabase.from('demands').update(updates).eq('id', id)

      if (error) { toast.error('Erro ao salvar.'); return }

      // Audit log
      await supabase.rpc('insert_audit_log', {
        p_user_id: profile.id,
        p_organization_id: demand.organization_id,
        p_entity_type: 'demands',
        p_entity_id: id,
        p_action: 'update',
        p_old_data: { status: demand.status, service_value: demand.service_value },
        p_new_data: { status, service_value: updates.service_value },
      })

      toast.success('Demanda atualizada com sucesso!')
      setDemand((prev) => prev ? { ...prev, ...updates } : prev)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCancel() {
    if (!demand || !cancelReason.trim() || !isSuperAdmin) return
    setIsSaving(true)
    try {
      const { error } = await supabase.from('demands').update({
        status: 'cancelado',
        canceled_at: new Date().toISOString(),
        cancel_reason: cancelReason,
      }).eq('id', id)

      if (error) { toast.error('Erro ao cancelar.'); return }

      toast.success('Demanda cancelada.')
      setDemand((prev) => prev ? { ...prev, status: 'cancelado', cancel_reason: cancelReason } : prev)
      setStatus('cancelado')
      setShowCancelDialog(false)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleArchive() {
    if (!demand || !isSuperAdmin) return
    setIsSaving(true)
    try {
      const { error } = await supabase.from('demands').update({
        status: 'arquivado',
        archived_at: new Date().toISOString(),
      }).eq('id', id)

      if (error) { toast.error('Erro ao arquivar.'); return }

      toast.success('Demanda arquivada.')
      setDemand((prev) => prev ? { ...prev, status: 'arquivado' } : prev)
      setStatus('arquivado')
      setShowArchiveDialog(false)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!demand) return null

  const timelineEvents = [
    { status: 'nova_solicitacao' as const, date: demand.created_at, label: 'Solicitação criada' },
    { status: 'programado' as const, date: demand.scheduled_at, label: 'Programado' },
    { status: 'em_andamento' as const, date: demand.started_at, label: 'Execução iniciada' },
    { status: 'concluido' as const, date: demand.completed_at, label: 'Concluído' },
    { status: 'cancelado' as const, date: demand.canceled_at, label: 'Cancelado' },
    { status: 'arquivado' as const, date: demand.archived_at, label: 'Arquivado' },
  ]

  const availableStatuses: DemandStatus[] = [
    'nova_solicitacao', 'programado', 'em_andamento', 'concluido', 'arquivado', 'cancelado',
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/demandas">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono text-gray-400">{demand.protocol_number}</span>
            <StatusBadge status={demand.status} />
            <UrgencyBadge urgency={demand.urgency} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            {DEMAND_TYPE_LABELS[demand.demand_type]}
            {demand.other_demand_type && ` — ${demand.other_demand_type}`}
          </h1>
          <p className="text-sm text-gray-500">
            {(demand as any).organization?.name} ·
            Solicitante: {(demand as any).created_by?.name}
          </p>
        </div>
        {isSuperAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
              onClick={() => setShowArchiveDialog(true)}
              disabled={['arquivado', 'cancelado'].includes(demand.status)}
            >
              <Archive className="h-4 w-4" />
              Arquivar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setShowCancelDialog(true)}
              disabled={['cancelado', 'concluido', 'arquivado'].includes(demand.status)}
            >
              <XCircle className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Edição principal */}
        <div className="lg:col-span-2 space-y-4">
          {isSuperAdmin && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Gerenciar Demanda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as DemandStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStatuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            {DEMAND_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Valor do Serviço (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={serviceValue}
                      onChange={(e) => setServiceValue(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas Internas (visível apenas para admin)</Label>
                  <Textarea
                    placeholder="Observações internas sobre esta demanda..."
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  {isSaving ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</>
                  ) : (
                    <><Save className="h-4 w-4" />Salvar alterações</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Dados da demanda */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dados da Solicitação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DataRow label="Local">{demand.city}/{demand.state}</DataRow>
              {demand.service_location && (
                <DataRow label="Endereço/Local">{demand.service_location}</DataRow>
              )}
              {demand.deadline_date && (
                <DataRow label="Prazo">
                  {demand.deadline_date}
                  {demand.deadline_time && ` às ${demand.deadline_time.substring(0, 5)}`}
                </DataRow>
              )}
              {demand.process_number && (
                <DataRow label="Processo">{demand.process_number}</DataRow>
              )}
              {demand.required_professional && (
                <DataRow label="Profissional">
                  {REQUIRED_PROFESSIONAL_LABELS[demand.required_professional]}
                </DataRow>
              )}
              {demand.service_value != null && (
                <DataRow label="Valor">
                  <span className="font-semibold text-green-700">
                    {formatCurrency(demand.service_value)}
                  </span>
                  {demand.is_value_confirmed_externally && (
                    <span className="ml-2 text-xs text-gray-400">(confirmado externamente)</span>
                  )}
                </DataRow>
              )}
              {demand.billing_type && (
                <DataRow label="Cobrança">
                  {demand.billing_type === 'mensal' ? 'Mensal' : 'Avulsa'}
                </DataRow>
              )}
              {demand.instructions && (
                <div>
                  <p className="text-xs text-gray-400 font-medium">Instruções</p>
                  <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{demand.instructions}</p>
                </div>
              )}
              {demand.admin_notes && (
                <div className="rounded bg-yellow-50 border border-yellow-200 p-3">
                  <p className="text-xs text-yellow-600 font-medium mb-1">Notas internas</p>
                  <p className="text-sm text-yellow-800 whitespace-pre-wrap">{demand.admin_notes}</p>
                </div>
              )}
              {demand.cancel_reason && (
                <div className="rounded bg-red-50 border border-red-200 p-3">
                  <p className="text-xs text-red-600 font-medium mb-1">Motivo do cancelamento</p>
                  <p className="text-sm text-red-800">{demand.cancel_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Anexos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Documentos ({attachments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <AttachmentList attachments={attachments} showCategory />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={timelineEvents} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 space-y-2">
              <p className="text-xs text-gray-400 font-medium">Cliente</p>
              <p className="text-sm font-medium text-gray-900">
                {(demand as any).organization?.name}
              </p>
              <p className="text-xs text-gray-500">
                {(demand as any).organization?.email}
              </p>
              <p className="text-xs text-gray-500">
                {(demand as any).organization?.phone}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Criada: {formatDateTime(demand.created_at)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        title="Arquivar demanda?"
        description="A demanda será arquivada e não aparecerá nas listagens padrão."
        confirmLabel="Arquivar"
        onConfirm={handleArchive}
        isLoading={isSaving}
      />

      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title="Cancelar demanda?"
        description={
          <div className="space-y-3">
            <p>Esta ação não pode ser desfeita. Informe o motivo:</p>
            <Textarea
              placeholder="Motivo do cancelamento..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
        }
        confirmLabel="Confirmar cancelamento"
        onConfirm={handleCancel}
        variant="destructive"
        isLoading={isSaving}
      />
    </div>
  )
}

function DataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs text-gray-400 font-medium w-28 flex-shrink-0 pt-0.5">{label}</span>
      <div className="text-sm text-gray-700 flex-1">{children}</div>
    </div>
  )
}
