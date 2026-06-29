'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
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
import { Combobox } from '@/components/ui/combobox'
import { BRAZIL_STATES } from '@/lib/constants'
import { getCitiesForState } from '@/lib/brazil-cities'
import type { DemandType } from '@/types'

interface StandardDemandFormProps {
  demandType: DemandType
}

export function StandardDemandForm({ demandType }: StandardDemandFormProps) {
  const { register, setValue, watch, formState: { errors } } = useFormContext()
  const [selectedState, setSelectedState] = useState('')
  const selectedCity = watch('city')

  const stateOptions = BRAZIL_STATES.map((s) => ({ value: s.value, label: `${s.value} — ${s.label}` }))
  const cityOptions = selectedState ? getCitiesForState(selectedState) : []

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Estado */}
        <div className="space-y-2">
          <Label>Estado *</Label>
          <Combobox
            options={stateOptions}
            value={selectedState}
            onChange={(v) => {
              setSelectedState(v)
              setValue('state', v)
              setValue('city', '')
            }}
            placeholder="Digite ou selecione o estado"
            searchPlaceholder="Buscar estado..."
            emptyText="Estado não encontrado."
          />
          {errors.state && <p className="text-red-500 text-xs">{String(errors.state.message)}</p>}
        </div>

        {/* Cidade */}
        <div className="space-y-2">
          <Label>Cidade *</Label>
          <Combobox
            options={cityOptions}
            value={selectedCity}
            onChange={(v) => setValue('city', v)}
            placeholder={selectedState ? 'Digite ou selecione a cidade' : 'Selecione o estado primeiro'}
            searchPlaceholder="Buscar cidade..."
            emptyText="Cidade não encontrada na lista."
            allowCustom
          />
          {errors.city && <p className="text-red-500 text-xs">{String(errors.city.message)}</p>}
        </div>

        {/* Urgência */}
        <div className="space-y-2">
          <Label>Urgência</Label>
          <Select defaultValue="normal" onValueChange={(v) => setValue('urgency', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="urgente">🔴 Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Prazo/Data */}
        <div className="space-y-2">
          <Label>Prazo / Data e Hora</Label>
          <Input type="datetime-local" {...register('deadline_date')} />
        </div>

        {/* Número do processo */}
        <div className="space-y-2">
          <Label>Número do Processo</Label>
          <Input placeholder="0000000-00.0000.0.00.0000" {...register('process_number')} />
        </div>

        {/* Profissional necessário */}
        <div className="space-y-2">
          <Label>Profissional Necessário</Label>
          <Select onValueChange={(v) => setValue('required_professional', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="advogado">Advogado</SelectItem>
              <SelectItem value="correspondente">Correspondente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Local do serviço */}
      <div className="space-y-2">
        <Label>Local do Serviço</Label>
        <Input
          placeholder="Ex: Fórum, cartório, delegacia, órgão público, endereço específico etc."
          {...register('service_location')}
        />
      </div>

      {/* Tipo personalizado (somente para 'outros') */}
      {demandType === 'outros' && (
        <div className="space-y-2">
          <Label>Qual tipo de demanda? *</Label>
          <Input
            placeholder="Descreva o tipo de demanda"
            {...register('other_demand_type')}
          />
          {errors.other_demand_type && (
            <p className="text-red-500 text-xs">{String(errors.other_demand_type.message)}</p>
          )}
        </div>
      )}

      {/* Instruções */}
      <div className="space-y-2">
        <Label>Instruções e Observações Adicionais</Label>
        <Textarea
          placeholder="Informe detalhes importantes para a execução da demanda..."
          rows={4}
          {...register('instructions')}
        />
      </div>
    </div>
  )
}
