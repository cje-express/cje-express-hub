'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ChevronLeft, Upload, Save, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
} from '@/lib/constants'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { Invoice, InvoiceItem, FinancialDocument } from '@/types'

export default function AdminFaturaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const id = params.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [docs, setDocs] = useState<FinancialDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [profile, setProfile] = useState<{ id: string; role: string } | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase.from('profiles').select('id, role').eq('auth_user_id', user.id).single()
      setProfile(prof)

      const { data: inv } = await supabase
        .from('invoices')
        .select('*, organization:organizations(name, email)')
        .eq('id', id)
        .single()

      if (!inv) { toast.error('Fatura não encontrada'); router.back(); return }

      setInvoice(inv as Invoice)
      setStatus(inv.status)
      setPaymentMethod(inv.payment_method ?? '')
      setNotes(inv.notes ?? '')

      const [{ data: invItems }, { data: finDocs }] = await Promise.all([
        supabase.from('invoice_items').select('*, demand:demands(demand_type, city, state)').eq('invoice_id', id),
        supabase.from('financial_documents').select('*').eq('invoice_id', id).order('created_at'),
      ])

      setItems((invItems as InvoiceItem[]) ?? [])
      setDocs((finDocs as FinancialDocument[]) ?? [])
      setIsLoading(false)
    }
    load()
  }, [id])

  const isSuperAdmin = profile?.role === 'SUPER_ADMIN_CJE'

  async function handleSave() {
    if (!invoice || !isSuperAdmin) return
    setIsSaving(true)
    try {
      const updates: Partial<Invoice> = {
        status: status as Invoice['status'],
        payment_method: paymentMethod as Invoice['payment_method'],
        notes: notes || null,
        paid_at: status === 'paid' && !invoice.paid_at ? new Date().toISOString() : invoice.paid_at,
      }

      const { error } = await supabase.from('invoices').update(updates).eq('id', id)
      if (error) { toast.error('Erro ao salvar.'); return }

      toast.success('Fatura atualizada!')
      setInvoice((prev) => prev ? { ...prev, ...updates } : prev)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCancel() {
    if (!isSuperAdmin) return
    setIsSaving(true)
    try {
      await supabase.from('invoices').update({ status: 'canceled' }).eq('id', id)
      toast.success('Fatura cancelada.')
      setStatus('canceled')
      setInvoice((prev) => prev ? { ...prev, status: 'canceled' } : prev)
      setShowCancelDialog(false)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUploadDoc(e: React.ChangeEvent<HTMLInputElement>, category: string) {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploading(true)
    try {
      const filePath = `organizations/invoices/${id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('financial-documents')
        .upload(filePath, file)

      if (uploadError) { toast.error('Erro no upload.'); return }

      const { data: urlData } = supabase.storage.from('financial-documents').getPublicUrl(filePath)

      const { data: doc } = await supabase
        .from('financial_documents')
        .insert({
          invoice_id: id,
          uploaded_by_user_id: profile.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          category,
        })
        .select()
        .single()

      if (doc) setDocs((prev) => [...prev, doc as FinancialDocument])
      toast.success('Documento anexado!')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (isLoading || !invoice) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const DOC_LABELS: Record<string, string> = {
    nota_fiscal: 'Nota Fiscal',
    boleto: 'Boleto',
    comprovante: 'Comprovante',
    resumo_demandas: 'Resumo de Demandas',
    outro: 'Outro',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/financeiro">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{invoice.invoice_number}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn(
              'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
              INVOICE_STATUS_COLORS[invoice.status]
            )}>
              {INVOICE_STATUS_LABELS[invoice.status]}
            </span>
            <span className="text-sm text-gray-500">
              {(invoice as any).organization?.name}
            </span>
          </div>
        </div>
        {isSuperAdmin && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setShowCancelDialog(true)}
            disabled={invoice.status === 'canceled'}
          >
            <XCircle className="h-4 w-4" />
            Cancelar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Período</p>
            <p className="text-sm font-medium mt-1">
              {formatDate(invoice.billing_period_start)} a {formatDate(invoice.billing_period_end)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Vencimento</p>
            <p className="text-sm font-medium mt-1">{formatDate(invoice.due_date)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Valor Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(invoice.total_amount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {isSuperAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Gerenciar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(INVOICE_STATUS_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Forma de pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</> : <><Save className="h-4 w-4" />Salvar</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Itens da Fatura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between py-3 gap-4">
                <p className="text-sm text-gray-800">{item.description}</p>
                <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                  {formatCurrency(item.amount)}
                </p>
              </div>
            ))}
            <div className="flex justify-between py-3 font-bold">
              <span>Total</span>
              <span>{formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Documentos Financeiros</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isSuperAdmin && (
            <div className="flex gap-2 flex-wrap">
              {['nota_fiscal', 'boleto', 'comprovante', 'resumo_demandas'].map((cat) => (
                <label key={cat} className="cursor-pointer">
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => handleUploadDoc(e, cat)}
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 pointer-events-none"
                    disabled={uploading}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {DOC_LABELS[cat]}
                  </Button>
                </label>
              ))}
            </div>
          )}

          {docs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum documento anexado.</p>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 rounded border bg-gray-50 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.file_name}</p>
                    <p className="text-xs text-gray-400">{DOC_LABELS[doc.category] ?? doc.category}</p>
                  </div>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download={doc.file_name}>
                    <Button variant="outline" size="sm">Baixar</Button>
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title="Cancelar fatura?"
        description="Esta ação não poderá ser desfeita."
        confirmLabel="Cancelar fatura"
        onConfirm={handleCancel}
        variant="destructive"
        isLoading={isSaving}
      />
    </div>
  )
}
