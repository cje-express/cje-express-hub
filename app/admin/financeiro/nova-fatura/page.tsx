'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, Plus, Trash2, Loader2 } from 'lucide-react'
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
import { createClient } from '@/lib/supabase/client'
import { PAYMENT_METHOD_LABELS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

interface LineItem {
  description: string
  amount: string
  demand_id?: string
}

export default function NovaFaturaPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([])
  const [selectedOrg, setSelectedOrg] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([{ description: '', amount: '' }])
  const [orgsLoaded, setOrgsLoaded] = useState(false)

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

  function addItem() {
    setItems([...items, { description: '', amount: '' }])
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i))
  }

  function updateItem(i: number, field: keyof LineItem, value: string) {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const total = items.reduce((s, i) => s + (parseFloat(i.amount.replace(',', '.')) || 0), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedOrg || !periodStart || !periodEnd || !dueDate) {
      toast.error('Preencha todos os campos obrigatórios.')
      return
    }

    const validItems = items.filter((i) => i.description && i.amount)
    if (validItems.length === 0) {
      toast.error('Adicione pelo menos um item à fatura.')
      return
    }

    setIsLoading(true)
    try {
      const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number')

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          organization_id: selectedOrg,
          invoice_number: invoiceNumber || `FAT-${Date.now()}`,
          billing_period_start: periodStart,
          billing_period_end: periodEnd,
          total_amount: total,
          status: 'open',
          payment_method: paymentMethod || null,
          due_date: dueDate,
          notes: notes || null,
        })
        .select()
        .single()

      if (error || !invoice) {
        toast.error('Erro ao criar fatura.')
        return
      }

      // Insert items
      await supabase.from('invoice_items').insert(
        validItems.map((item) => ({
          invoice_id: invoice.id,
          demand_id: item.demand_id || null,
          description: item.description,
          amount: parseFloat(item.amount.replace(',', '.')),
        }))
      )

      toast.success('Fatura criada com sucesso!')
      router.push(`/admin/financeiro/${invoice.id}`)
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
          <h1 className="text-2xl font-bold text-gray-900">Nova Fatura</h1>
          <p className="text-sm text-gray-500">Emitir fatura para cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados da Fatura</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Cliente *</Label>
              <Select
                onOpenChange={(o) => { if (o) loadOrganizations() }}
                onValueChange={setSelectedOrg}
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

            <div className="space-y-2">
              <Label>Período — início *</Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Período — fim *</Label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Vencimento *</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Informações adicionais sobre a fatura..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Itens da Fatura</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={addItem} className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                Adicionar item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Descrição do serviço / demanda"
                    value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                  />
                </div>
                <div className="w-32 space-y-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={item.amount}
                    onChange={(e) => updateItem(i, 'amount', e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(i)}
                  className="flex-shrink-0 text-red-500 hover:bg-red-50"
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="flex justify-end border-t pt-3">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={isLoading} className="gap-2">
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Criando...</>
            ) : (
              'Criar fatura'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
