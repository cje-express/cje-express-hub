import Link from 'next/link'
import {
  FileText, Clock, CheckCircle, AlertTriangle,
  CreditCard, Plus, ArrowRight, Users, TrendingUp, Calendar,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { IS_DEMO_MODE, DEMO_STATS_ADMIN, DEMO_DEMANDS } from '@/lib/demo'
import { getServerProfile } from '@/lib/server-session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/common/StatusBadge'
import { UrgencyBadge } from '@/components/common/UrgencyBadge'
import { formatDate, formatCurrency, isDeadlineNear } from '@/lib/utils'
import { DEMAND_TYPE_LABELS } from '@/lib/constants'
import type { Demand } from '@/types'

export default async function AdminDashboard() {
  await getServerProfile() // garante autenticação

  let stats = DEMO_STATS_ADMIN
  let demandasRecentes: Demand[] = DEMO_DEMANDS
  let demandasUrgentes: Demand[] = DEMO_DEMANDS.filter(d => d.urgency === 'urgente')
  let valorMes = 530
  let totalClientes = 3

  if (!IS_DEMO_MODE) {
    const supabase = await createClient()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [
      { count: novas },
      { count: programadas },
      { count: emAndamento },
      { count: concluidasMes },
      { count: urgentes },
      { count: faturasAbertas },
      { data: valorMesData },
      { count: clientesCount },
    ] = await Promise.all([
      supabase.from('demands').select('*', { count: 'exact', head: true }).eq('status', 'nova_solicitacao').is('deleted_at', null),
      supabase.from('demands').select('*', { count: 'exact', head: true }).eq('status', 'programado').is('deleted_at', null),
      supabase.from('demands').select('*', { count: 'exact', head: true }).eq('status', 'em_andamento').is('deleted_at', null),
      supabase.from('demands').select('*', { count: 'exact', head: true }).eq('status', 'concluido').gte('completed_at', startOfMonth).is('deleted_at', null),
      supabase.from('demands').select('*', { count: 'exact', head: true }).eq('urgency', 'urgente').in('status', ['nova_solicitacao', 'programado', 'em_andamento']).is('deleted_at', null),
      supabase.from('invoices').select('*', { count: 'exact', head: true }).in('status', ['open', 'overdue']),
      supabase.from('invoices').select('total_amount').eq('status', 'paid').gte('paid_at', startOfMonth),
      supabase.from('organizations').select('*', { count: 'exact', head: true }).neq('type', 'interno').eq('status', 'active'),
    ])

    valorMes = (valorMesData ?? []).reduce((sum: number, i: { total_amount: number }) => sum + (i.total_amount ?? 0), 0)
    totalClientes = clientesCount ?? 0

    stats = {
      total: (novas ?? 0) + (programadas ?? 0) + (emAndamento ?? 0) + (concluidasMes ?? 0),
      nova_solicitacao: novas ?? 0,
      programado: programadas ?? 0,
      em_andamento: emAndamento ?? 0,
      concluido: concluidasMes ?? 0,
      arquivado: 0,
      cancelado: 0,
      urgentes: urgentes ?? 0,
      faturasAbertas: faturasAbertas ?? 0,
      valorTotalMes: valorMes,
    }

    const { data: recentData } = await supabase
      .from('demands')
      .select('*, organization:organizations(name), created_by:profiles!demands_created_by_user_id_fkey(name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(8)
    demandasRecentes = (recentData as Demand[]) ?? []

    const { data: urgentData } = await supabase
      .from('demands')
      .select('*, organization:organizations(name)')
      .eq('urgency', 'urgente')
      .in('status', ['nova_solicitacao', 'programado', 'em_andamento'])
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5)
    demandasUrgentes = (urgentData as Demand[]) ?? []
  }

  const adminStats = [
    { label: 'Novas Solicitações', value: stats.nova_solicitacao, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', href: '/admin/demandas?status=nova_solicitacao' },
    { label: 'Programadas', value: stats.programado, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50', href: '/admin/demandas?status=programado' },
    { label: 'Em Andamento', value: stats.em_andamento, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', href: '/admin/demandas?status=em_andamento' },
    { label: 'Concluídas no Mês', value: stats.concluido, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', href: '/admin/demandas?status=concluido' },
    { label: 'Urgentes', value: stats.urgentes, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', href: '/admin/demandas?urgency=urgente' },
    { label: 'Faturas Abertas', value: stats.faturasAbertas, icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50', href: '/admin/financeiro?status=open' },
    { label: 'Clientes Ativos', value: totalClientes, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', href: '/admin/clientes' },
    { label: 'Faturado no Mês', value: formatCurrency(valorMes), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/admin/financeiro' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-sm text-gray-500 mt-0.5">CJE Express Hub — Visão geral</p>
        </div>
        <Link href="/admin/demandas/nova">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Demanda
          </Button>
        </Link>
      </div>

      {IS_DEMO_MODE && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
          Modo demonstração — dados fictícios
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {adminStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 leading-tight">{stat.label}</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`rounded-lg p-2 ${stat.bg}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Demandas Recentes</CardTitle>
                <Link href="/admin/demandas">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Ver todas <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {demandasRecentes.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">Nenhuma demanda ainda.</p>
              ) : (
                <div className="divide-y">
                  {demandasRecentes.map((demand: any) => (
                    <div key={demand.id} className="flex items-center justify-between py-3 gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono text-gray-400">{demand.protocol_number}</span>
                          <UrgencyBadge urgency={demand.urgency} className="scale-90 origin-left" />
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {DEMAND_TYPE_LABELS[demand.demand_type as keyof typeof DEMAND_TYPE_LABELS]} — {demand.city}/{demand.state}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {demand.organization?.name ?? 'Escritório Demo Advogados'}
                          {demand.deadline_date && isDeadlineNear(demand.deadline_date, demand.status) && (
                            <span className="ml-2 text-amber-600 font-medium">⚠ Prazo próximo</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge status={demand.status} />
                        <Link href={`/admin/demandas/${demand.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-red-700">
                🔴 Demandas Urgentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {demandasUrgentes.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">Nenhuma urgente.</p>
              ) : (
                <div className="space-y-3">
                  {demandasUrgentes.map((demand: any) => (
                    <Link
                      key={demand.id}
                      href={`/admin/demandas/${demand.id}`}
                      className="block rounded-lg border border-red-100 bg-red-50 p-3 hover:bg-red-100 transition-colors"
                    >
                      <p className="text-xs text-gray-400 font-mono">{demand.protocol_number}</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">
                        {DEMAND_TYPE_LABELS[demand.demand_type as keyof typeof DEMAND_TYPE_LABELS]}
                      </p>
                      <p className="text-xs text-gray-500">
                        {demand.city}/{demand.state} · {demand.organization?.name ?? 'Escritório Demo'}
                      </p>
                      {demand.deadline_date && (
                        <p className="text-xs text-red-600 font-medium mt-1">
                          Prazo: {formatDate(demand.deadline_date)}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
