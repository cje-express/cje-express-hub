import Link from 'next/link'
import { CreditCard } from 'lucide-react'
import { getServerProfile } from '@/lib/server-session'
import { IS_DEMO_MODE } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate, formatCurrency } from '@/lib/utils'
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Invoice } from '@/types'

export default async function ClienteFinanceiroPage() {
  const profile = await getServerProfile()

  let invoices: Invoice[] = []

  if (!IS_DEMO_MODE) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('invoices')
      .select('*, items:invoice_items(count)')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
    invoices = (data as Invoice[]) ?? []
  }

  const totalAberto = invoices
    .filter((i) => ['open', 'overdue'].includes(i.status))
    .reduce((sum, i) => sum + (i.total_amount ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-sm text-gray-500 mt-0.5">Faturas e documentos financeiros</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">Total em Aberto</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalAberto)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">Faturas Abertas</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {invoices.filter((i) => i.status === 'open').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">Faturas Vencidas</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {invoices.filter((i) => i.status === 'overdue').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhuma fatura ainda"
          description="Suas faturas aparecerão aqui quando forem geradas pela equipe CJE Express."
        />
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium text-gray-700">
                        {invoice.invoice_number}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                          INVOICE_STATUS_COLORS[invoice.status]
                        )}
                      >
                        {INVOICE_STATUS_LABELS[invoice.status]}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(invoice.total_amount)}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span>
                        Período: {formatDate(invoice.billing_period_start)} a{' '}
                        {formatDate(invoice.billing_period_end)}
                      </span>
                      <span>·</span>
                      <span>Vencimento: {formatDate(invoice.due_date)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Link href={`/cliente/financeiro/${invoice.id}`}>
                      <Button variant="outline" size="sm">Ver detalhes</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
