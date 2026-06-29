import Link from 'next/link'
import { Plus, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getServerProfile } from '@/lib/server-session'
import { IS_DEMO_MODE } from '@/lib/demo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@/lib/constants'
import type { Invoice } from '@/types'

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminFinanceiroPage({ searchParams }: Props) {
  const params = await searchParams
  await getServerProfile()

  let invoices: any[] = []

  if (!IS_DEMO_MODE) {
    const supabase = await createClient()

    let query = supabase
      .from('invoices')
      .select('*, organization:organizations(name)')
      .order('created_at', { ascending: false })

    if (params.status) query = query.eq('status', params.status)

    const { data } = await query.limit(100)
    invoices = data ?? []
  }

  const totalAberto = (invoices ?? [])
    .filter((i) => ['open', 'overdue'].includes(i.status))
    .reduce((s, i) => s + (i.total_amount ?? 0), 0)

  const totalPago = (invoices ?? [])
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + (i.total_amount ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestão de faturas</p>
        </div>
        <Link href="/admin/financeiro/nova-fatura">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Fatura
          </Button>
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Em Aberto', value: formatCurrency(totalAberto), color: 'text-blue-700' },
          { label: 'Vencidas', value: (invoices ?? []).filter(i => i.status === 'overdue').length, color: 'text-red-700' },
          { label: 'Pagas (filtro atual)', value: formatCurrency(totalPago), color: 'text-green-700' },
          { label: 'Total de Faturas', value: invoices?.length ?? 0, color: 'text-gray-700' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!invoices || invoices.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhuma fatura encontrada"
          description="Crie a primeira fatura para um cliente."
          action={
            <Link href="/admin/financeiro/nova-fatura">
              <Button>Nova fatura</Button>
            </Link>
          }
        />
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº Fatura</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Período</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Vencimento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(invoices as any[]).map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-medium text-gray-700">{inv.invoice_number}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-gray-600">{inv.organization?.name}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-gray-500">
                      {formatDate(inv.billing_period_start)} a {formatDate(inv.billing_period_end)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-gray-500">{formatDate(inv.due_date)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-900">{formatCurrency(inv.total_amount)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                      INVOICE_STATUS_COLORS[inv.status as keyof typeof INVOICE_STATUS_COLORS]
                    )}>
                      {INVOICE_STATUS_LABELS[inv.status as keyof typeof INVOICE_STATUS_LABELS]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/financeiro/${inv.id}`}>
                      <Button size="sm" variant="outline">Gerenciar</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
