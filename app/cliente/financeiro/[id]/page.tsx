import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Download, FileText } from 'lucide-react'
import { getServerProfile } from '@/lib/server-session'
import { IS_DEMO_MODE } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS, DEMAND_TYPE_LABELS } from '@/lib/constants'
import type { Invoice, InvoiceItem, FinancialDocument } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClienteFaturaDetailPage({ params }: Props) {
  const { id } = await params
  const profile = await getServerProfile()

  if (IS_DEMO_MODE) {
    notFound()
  }

  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!invoice) notFound()

  const [{ data: items }, { data: financialDocs }] = await Promise.all([
    supabase
      .from('invoice_items')
      .select('*, demand:demands(demand_type, city, state, protocol_number)')
      .eq('invoice_id', id)
      .order('created_at'),
    supabase
      .from('financial_documents')
      .select('*')
      .eq('invoice_id', id)
      .order('created_at'),
  ])

  const inv = invoice as Invoice
  const docItems = (items as InvoiceItem[]) ?? []
  const docs = (financialDocs as FinancialDocument[]) ?? []

  const DOC_LABELS: Record<string, string> = {
    nota_fiscal: 'Nota Fiscal',
    boleto: 'Boleto',
    comprovante: 'Comprovante',
    resumo_demandas: 'Resumo de Demandas',
    outro: 'Outro',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/cliente/financeiro">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{inv.invoice_number}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                INVOICE_STATUS_COLORS[inv.status]
              )}
            >
              {INVOICE_STATUS_LABELS[inv.status]}
            </span>
          </div>
        </div>
      </div>

      {/* Invoice summary */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 font-medium">Período</p>
              <p className="text-sm text-gray-800 mt-0.5">
                {formatDate(inv.billing_period_start)} a {formatDate(inv.billing_period_end)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Vencimento</p>
              <p className="text-sm text-gray-800 mt-0.5">{formatDate(inv.due_date)}</p>
            </div>
            {inv.paid_at && (
              <div>
                <p className="text-xs text-gray-400 font-medium">Pago em</p>
                <p className="text-sm text-green-700 font-medium mt-0.5">{formatDate(inv.paid_at)}</p>
              </div>
            )}
          </div>
          <div className="border-t pt-3">
            <p className="text-xs text-gray-400 font-medium">Valor Total</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(inv.total_amount)}</p>
          </div>
          {inv.notes && (
            <div className="border-t pt-3">
              <p className="text-xs text-gray-400 font-medium">Observações</p>
              <p className="text-sm text-gray-700 mt-0.5">{inv.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      {docItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Demandas Incluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {docItems.map((item) => (
                <div key={item.id} className="flex items-start justify-between py-3 gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.description}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              ))}
              <div className="flex justify-between py-3 font-bold">
                <span className="text-sm">Total</span>
                <span className="text-sm">{formatCurrency(inv.total_amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial documents */}
      {docs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-lg border bg-gray-50 p-3"
              >
                <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.file_name}</p>
                  <p className="text-xs text-gray-400">
                    {DOC_LABELS[doc.category] ?? doc.category}
                  </p>
                </div>
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download={doc.file_name}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
