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
import {
  HEARING_AREA_LABELS,
  HEARING_TYPE_LABELS,
  HEARING_FORMAT_LABELS,
  BRAZIL_STATES,
} from '@/lib/constants'
import { getCitiesForState } from '@/lib/brazil-cities'

export function AudienceForm() {
  const { register, setValue, watch, formState: { errors } } = useFormContext()
  const [selectedState, setSelectedState] = useState('')
  const selectedCity = watch('city')

  const stateOptions = BRAZIL_STATES.map((s) => ({ value: s.value, label: `${s.value} — ${s.label}` }))
  const cityOptions = selectedState ? getCitiesForState(selectedState) : []

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Área da audiência */}
        <div className="space-y-2">
          <Label>Área da Audiência *</Label>
          <Select onValueChange={(v) => setValue('hearing_area', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a área" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(HEARING_AREA_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.hearing_area && (
            <p className="text-red-500 text-xs">{String(errors.hearing_area.message)}</p>
          )}
        </div>

        {/* Tipo de audiência */}
        <div className="space-y-2">
          <Label>Tipo de Audiência *</Label>
          <Select onValueChange={(v) => setValue('hearing_type', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(HEARING_TYPE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.hearing_type && (
            <p className="text-red-500 text-xs">{String(errors.hearing_type.message)}</p>
          )}
        </div>

        {/* Formato */}
        <div className="space-y-2">
          <Label>Formato *</Label>
          <Select onValueChange={(v) => setValue('hearing_format', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Presencial ou Virtual" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(HEARING_FORMAT_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.hearing_format && (
            <p className="text-red-500 text-xs">{String(errors.hearing_format.message)}</p>
          )}
        </div>

        {/* Data e Hora */}
        <div className="space-y-2">
          <Label>Data e Hora da Audiência</Label>
          <Input type="datetime-local" {...register('hearing_datetime')} />
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
              <SelectItem value="somente_advogado">Somente Advogado</SelectItem>
              <SelectItem value="somente_preposto">Somente Preposto</SelectItem>
              <SelectItem value="advogado_e_preposto">Advogado + Preposto</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
      </div>

      {/* Local do serviço */}
      <div className="space-y-2">
        <Label>Local do Serviço</Label>
        <Input
          placeholder="Ex: Fórum Trabalhista de São Paulo, Sala 3"
          {...register('service_location')}
        />
      </div>

      {/* Instruções adicionais */}
      <div className="space-y-2">
        <Label>Instruções e Observações Adicionais</Label>
        <Textarea
          placeholder="Informações relevantes para execução da audiência..."
          rows={4}
          {...register('instructions')}
        />
      </div>
    </div>
  )
}
