'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Send, Loader2, CheckCircle, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DemandTypeSelector } from '@/components/demands/DemandTypeSelector'
import { AudienceForm } from '@/components/demands/AudienceForm'
import { StandardDemandForm } from '@/components/demands/StandardDemandForm'
import { FileUploader } from '@/components/demands/FileUploader'
import { createClient } from '@/lib/supabase/client'
import { WHATSAPP_URL, WHATSAPP_MESSAGE } from '@/lib/constants'
import type { DemandType } from '@/types'

const IS_DEMO = !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co') ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')

const baseSchema = z.object({
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(1, 'Estado é obrigatório'),
  service_location: z.string().optional(),
  urgency: z.enum(['normal', 'urgente']).optional(),
  deadline_date: z.string().optional(),
  process_number: z.string().optional(),
  required_professional: z.string().optional(),
  instructions: z.string().optional(),
  other_demand_type: z.string().optional(),
  billing_type: z.enum(['mensal', 'avulsa']).optional(),
  billing_name: z.string().optional(),
  billing_document: z.string().optional(),
  billing_email: z.string().optional(),
  billing_phone: z.string().optional(),
  hearing_area: z.string().optional(),
  hearing_type: z.string().optional(),
  hearing_format: z.string().optional(),
  hearing_datetime: z.string().optional(),
})

type FormData = z.infer<typeof baseSchema>

const STEPS = ['Tipo', 'Detalhes', 'Documentos', 'Faturamento', 'Revisão']

interface SelectedFile {
  file: File
  error?: string
}

interface OrgInfo {
  name: string
  cnpj_cpf: string | null
  email: string | null
  phone: string | null
}

export default function NovaDemandaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [selectedType, setSelectedType] = useState<DemandType | null>(null)
  const [files, setFiles] = useState<SelectedFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [org, setOrg] = useState<OrgInfo | null>(null)

  useEffect(() => {
    if (IS_DEMO) return
    async function loadOrg() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('auth_user_id', user.id)
        .single()
      if (!profile?.organization_id) return
      const { data: organization } = await supabase
        .from('organizations')
        .select('name, cnpj_cpf, email, phone')
        .eq('id', profile.organization_id)
        .single()
      if (organization) setOrg(organization)
    }
    loadOrg()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const methods = useForm<FormData>({
    resolver: zodResolver(baseSchema),
    defaultValues: { urgency: 'normal', billing_type: 'avulsa' },
  })

  const { handleSubmit, getValues, setValue, watch, register } = methods
  const billingType = watch('billing_type')

  function nextStep() {
    if (step === 0 && !selectedType) {
      toast.error('Selecione o tipo de demanda')
      return
    }
    if (step === 3 && billingType === 'avulsa') {
      const vals = getValues()
      if (!vals.billing_name || !vals.billing_document) {
        toast.error('Preencha os dados de faturamento')
        return
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function onSubmit(data: FormData) {
    if (!selectedType) return

    if (selectedType === 'audiencia') {
      if (!data.hearing_area || !data.hearing_type || !data.hearing_format) {
        toast.error('Preencha os campos obrigatórios da audiência')
        setStep(1)
        return
      }
    }

    if (selectedType === 'outros' && !data.other_demand_type) {
      toast.error('Informe o tipo de demanda')
      setStep(1)
      return
    }

    setIsSubmitting(true)
    try {
      if (IS_DEMO) {
        await new Promise((r) => setTimeout(r, 1500))
        setSubmitted(true)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Sessão expirada'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, organization_id')
        .eq('auth_user_id', user.id)
        .single()

      if (!profile) { toast.error('Perfil não encontrado'); return }

      const { data: protocolData } = await supabase.rpc('generate_protocol_number')
      const protocol = protocolData || `CJE-${Date.now()}`

      const { data: demand, error: demandError } = await supabase
        .from('demands')
        .insert({
          protocol_number: protocol,
          organization_id: profile.organization_id,
          created_by_user_id: profile.id,
          title: `${selectedType} — ${data.city}/${data.state}`,
          demand_type: selectedType,
          other_demand_type: data.other_demand_type || null,
          status: 'nova_solicitacao',
          urgency: data.urgency || 'normal',
          city: data.city,
          state: data.state,
          service_location: data.service_location || null,
          deadline_date: data.deadline_date ? data.deadline_date.split('T')[0] : null,
          deadline_time: data.deadline_date ? data.deadline_date.split('T')[1] : null,
          process_number: data.process_number || null,
          required_professional: data.required_professional || null,
          instructions: data.instructions || null,
          billing_type: data.billing_type || 'avulsa',
          demand_source: 'client_form',
        })
        .select()
        .single()

      if (demandError || !demand) {
        toast.error('Erro ao criar demanda. Tente novamente.')
        return
      }

      if (selectedType === 'audiencia' && data.hearing_area && data.hearing_type && data.hearing_format) {
        await supabase.from('demand_audience_details').insert({
          demand_id: demand.id,
          hearing_area: data.hearing_area,
          hearing_type: data.hearing_type,
          hearing_format: data.hearing_format,
          hearing_datetime: data.hearing_datetime || null,
          process_number: data.process_number || null,
          required_professional: data.required_professional || null,
          city: data.city,
          state: data.state,
          service_location: data.service_location || null,
          additional_instructions: data.instructions || null,
        })
      }

      // Notificar admins sobre nova demanda
      fetch('/api/demands/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demandId: demand.id,
          title: demand.title,
          protocol: demand.protocol_number,
          orgName: org?.name ?? '',
        }),
      }).catch(() => {})

      const validFiles = files.filter((f) => !f.error)
      for (const { file } of validFiles) {
        const filePath = `organizations/${profile.organization_id}/demands/${demand.id}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage.from('demand-documents').upload(filePath, file)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('demand-documents').getPublicUrl(filePath)
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + 90)
          await supabase.from('demand_attachments').insert({
            demand_id: demand.id,
            uploaded_by_user_id: profile.id,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            category: 'client_document',
            visibility: 'client_and_admin',
            expires_at: expiresAt.toISOString(),
          })
        }
      }

      setSubmitted(true)
    } catch {
      toast.error('Erro inesperado. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Tela de confirmação
  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-blue-50">
          <CheckCircle className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Recebemos sua solicitação</h1>
        <p className="text-gray-500">
          Nossa equipe entrará em contato em minutos pelo WhatsApp para prosseguir com a solicitação.
        </p>
        <div className="space-y-3 pt-2">
          <a
            href={`${WHATSAPP_URL}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button variant="outline" className="w-full gap-2 h-12 text-green-700 border-green-300 hover:bg-green-50">
              <MessageCircle className="h-5 w-5" />
              Falar com atendente pelo WhatsApp
            </Button>
          </a>
          <Link href="/cliente/dashboard" className="block">
            <Button variant="ghost" className="w-full h-12 text-gray-500">
              Voltar para o painel principal
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const values = getValues()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Solicitação</h1>
          <p className="text-sm text-gray-500">Preencha os dados da demanda</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold flex-shrink-0 transition-colors ${
                i < step ? 'bg-green-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-blue-600' : 'text-gray-400'}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-px flex-1 ${i < step ? 'bg-green-300' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 0: Tipo */}
          {step === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Selecione o tipo de demanda</CardTitle>
              </CardHeader>
              <CardContent>
                <DemandTypeSelector value={selectedType} onChange={setSelectedType} />
              </CardContent>
            </Card>
          )}

          {/* Step 1: Detalhes */}
          {step === 1 && selectedType && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedType === 'audiencia' ? 'Dados da Audiência' : 'Dados da Demanda'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {selectedType === 'audiencia' ? <AudienceForm /> : <StandardDemandForm demandType={selectedType} />}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Documentos */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Importar Documentos</CardTitle>
                <p className="text-sm text-gray-500">Anexe documentos relevantes (opcional). Os arquivos ficam disponíveis por 90 dias.</p>
              </CardHeader>
              <CardContent>
                <FileUploader files={files} onChange={setFiles} />
              </CardContent>
            </Card>
          )}

          {/* Step 3: Faturamento */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Faturamento e Cobrança</CardTitle>
                <p className="text-sm text-gray-500">Selecione como deseja ser cobrado por esta demanda.</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue('billing_type', 'mensal')}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      billingType === 'mensal'
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-bold text-gray-900">Mensal</p>
                    <p className="text-xs text-gray-500 mt-1">Consolidado na fatura mensal da sua empresa</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('billing_type', 'avulsa')}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      billingType === 'avulsa'
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-bold text-gray-900">Avulsa</p>
                    <p className="text-xs text-gray-500 mt-1">Pagamento individual via Boleto ou PIX</p>
                  </button>
                </div>

                {billingType === 'mensal' && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
                    <p className="text-sm font-medium text-green-800">Dados da empresa (preenchidos automaticamente)</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-green-600">Empresa</p>
                        <p className="font-medium text-gray-900">{org?.name ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600">CNPJ</p>
                        <p className="font-medium text-gray-900">{org?.cnpj_cpf ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600">E-mail</p>
                        <p className="font-medium text-gray-900">{org?.email ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600">Telefone</p>
                        <p className="font-medium text-gray-900">{org?.phone ?? '—'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {billingType === 'avulsa' && (
                  <div className="space-y-4 pt-2">
                    <p className="text-sm font-medium text-gray-700">Dados para faturamento avulso</p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Nome completo / Razão Social *</Label>
                        <Input placeholder="Nome ou razão social para a nota" {...register('billing_name')} />
                      </div>
                      <div className="space-y-2">
                        <Label>CPF ou CNPJ *</Label>
                        <Input placeholder="000.000.000-00" {...register('billing_document')} />
                      </div>
                      <div className="space-y-2">
                        <Label>E-mail para envio</Label>
                        <Input type="email" placeholder="email@exemplo.com.br" {...register('billing_email')} />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input placeholder="(11) 99999-9999" {...register('billing_phone')} />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Revisão */}
          {step === 4 && selectedType && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revisar e Enviar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
                  <ReviewRow label="Tipo" value={selectedType === 'outros' ? `Outros: ${values.other_demand_type}` : selectedType} />
                  <ReviewRow label="Cidade/Estado" value={`${values.city}/${values.state}`} />
                  {values.service_location && <ReviewRow label="Local" value={values.service_location} />}
                  {values.urgency && <ReviewRow label="Urgência" value={values.urgency === 'urgente' ? '🔴 Urgente' : 'Normal'} />}
                  {values.deadline_date && <ReviewRow label="Prazo" value={new Date(values.deadline_date).toLocaleString('pt-BR')} />}
                  {values.process_number && <ReviewRow label="Processo" value={values.process_number} />}
                  {values.required_professional && <ReviewRow label="Profissional" value={values.required_professional} />}
                  {files.filter(f => !f.error).length > 0 && (
                    <ReviewRow label="Documentos" value={`${files.filter(f => !f.error).length} arquivo(s)`} />
                  )}
                  {values.instructions && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">Instruções</p>
                      <p className="text-sm text-gray-800 mt-0.5">{values.instructions}</p>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border bg-gray-50 p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Faturamento</p>
                  <ReviewRow label="Tipo" value={billingType === 'mensal' ? 'Mensal (fatura consolidada)' : 'Avulsa (Boleto / PIX)'} />
                  {billingType === 'avulsa' && values.billing_name && (
                    <>
                      <ReviewRow label="Nome" value={values.billing_name} />
                      {values.billing_document && <ReviewRow label="CPF/CNPJ" value={values.billing_document} />}
                      {values.billing_email && <ReviewRow label="E-mail" value={values.billing_email} />}
                    </>
                  )}
                  {billingType === 'mensal' && org && (
                    <ReviewRow label="Empresa" value={`${org.name}${org.cnpj_cpf ? ` — ${org.cnpj_cpf}` : ''}`} />
                  )}
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-medium mb-1">Atenção</p>
                  <p>
                    Toda solicitação enviada será analisada pela equipe CJE Express. Após o envio,
                    alterações ou cancelamentos deverão ser solicitados diretamente ao atendimento.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-4">
            <Button type="button" variant="outline" onClick={prevStep} disabled={step === 0}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>

            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Enviando...</>
                ) : (
                  <><Send className="h-4 w-4" />Enviar solicitação</>
                )}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs font-medium text-gray-500 w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  )
}
