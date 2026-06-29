'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ChevronLeft, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DemandTypeSelector } from '@/components/demands/DemandTypeSelector'
import { AudienceForm } from '@/components/demands/AudienceForm'
import { StandardDemandForm } from '@/components/demands/StandardDemandForm'
import { createClient } from '@/lib/supabase/client'
import type { DemandType } from '@/types'

const schema = z.object({
  organization_id: z.string().min(1, 'Selecione o cliente'),
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
  service_value: z.string().optional(),
  hearing_area: z.string().optional(),
  hearing_type: z.string().optional(),
  hearing_format: z.string().optional(),
  hearing_datetime: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function AdminNovaDemandaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [selectedType, setSelectedType] = useState<DemandType | null>(null)
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [orgsLoaded, setOrgsLoaded] = useState(false)

  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { urgency: 'normal', billing_type: 'avulsa' },
  })

  const { handleSubmit, setValue, register } = methods

  async function loadOrganizations() {
    if (orgsLoaded) return
    const { data } = await supabase
      .from('organizations')
      .select('id, name')
      .neq('type', 'interno')
      .eq('status', 'active')
      .order('name')
    setOrganizations(data ?? [])
    setOrgsLoaded(true)
  }

  async function onSubmit(data: FormData) {
    if (!selectedType) { toast.error('Selecione o tipo de demanda'); return }

    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!profile) return

      const { data: protocolData } = await supabase.rpc('generate_protocol_number')

      const { data: demand, error } = await supabase
        .from('demands')
        .insert({
          protocol_number: protocolData || `CJE-${Date.now()}`,
          organization_id: data.organization_id,
          created_by_user_id: profile.id,
          assigned_admin_id: profile.id,
          title: `${selectedType} — ${data.city}/${data.state}`,
          demand_type: selectedType,
          other_demand_type: data.other_demand_type || null,
          status: 'nova_solicitacao',
          urgency: data.urgency,
          city: data.city,
          state: data.state,
          service_location: data.service_location || null,
          deadline_date: data.deadline_date ? data.deadline_date.split('T')[0] : null,
          deadline_time: data.deadline_date ? data.deadline_date.split('T')[1] : null,
          process_number: data.process_number || null,
          required_professional: data.required_professional || null,
          instructions: data.instructions || null,
          billing_type: data.billing_type,
          service_value: data.service_value ? parseFloat(data.service_value) : null,
          is_value_confirmed_externally: !!data.service_value,
          demand_source: 'manual',
        })
        .select()
        .single()

      if (error || !demand) { toast.error('Erro ao criar demanda.'); return }

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
        })
      }

      toast.success('Demanda criada com sucesso!')
      router.push(`/admin/demandas/${demand.id}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Demanda Manual</h1>
          <p className="text-sm text-gray-500">Criar demanda em nome de um cliente</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Cliente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Selecione o cliente *</Label>
                <Select
                  onOpenChange={(open) => { if (open) loadOrganizations() }}
                  onValueChange={(v) => setValue('organization_id', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Valor (opcional para demanda manual) */}
              <div className="space-y-2">
                <Label>Valor do Serviço (R$) — opcional</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...register('service_value')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tipo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tipo de Demanda</CardTitle>
            </CardHeader>
            <CardContent>
              <DemandTypeSelector
                value={selectedType}
                onChange={setSelectedType}
              />
            </CardContent>
          </Card>

          {/* Form fields */}
          {selectedType && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {selectedType === 'audiencia' ? 'Dados da Audiência' : 'Dados da Demanda'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedType === 'audiencia' ? (
                  <AudienceForm />
                ) : (
                  <StandardDemandForm demandType={selectedType} />
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !selectedType} className="gap-2">
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Criando...</>
              ) : (
                <><Send className="h-4 w-4" />Criar demanda</>
              )}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}
