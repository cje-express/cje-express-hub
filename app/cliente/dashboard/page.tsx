import Link from 'next/link'
import {
  FileText, Clock, CheckCircle, AlertCircle, CreditCard, Plus, ArrowRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { IS_DEMO_MODE, DEMO_STATS_CLIENTE, DEMO_DEMANDS } from '@/lib/demo'
import { getServerProfile } from '@/lib/server-session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/common/StatusBadge'
import { UrgencyBadge } from '@/components/common/UrgencyBadge'
import { formatDateTime } from '@/lib/utils'
import { DEMAND_TYPE_LABELS } from '@/lib/constants'
import type { Demand } from '@/types'

export default async function ClienteDashboard() {
  const profile = await getServerProfile()

  let statsData = DEMO_STATS_CLIENTE
  let demandasRecentes: Demand[] = DEMO_DEMANDS

  if (!IS_DEMO_MODE) {
    const supabase = await createClient()
    const orgId = profile.organization_id

    const [
      { count: total },
      { count: emAndamento },
      { count: concluidas },
      { count: programadas },
      { count: faturasAbertas },
    ] = await Promise.all([
      supabase.from('demands').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).is('deleted_at', null),
      supabase.from('demands').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'em_andamento').is('deleted_at', null),
      supabase.from('demands').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'concluido').is('deleted_at', null),
      supabase.from('demands').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).in('status', ['nova_solicitacao', 'programado']).is('deleted_at', null),
      supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).in('status', ['open', 'overdue']),
    ])

    statsData = {
      total: total ?? 0,
      nova_solicitacao: programadas ?? 0,
      programado: programadas ?? 0,
      em_andamento: emAndamento ?? 0,
      concluido: concluidas ?? 0,
      arquivado: 0,
      cancelado: 0,
      urgentes: 0,
      faturasAbertas: faturasAbertas ?? 0,
      valorTotalMes: 0,
    }

    const { data } = await supabase
      .from('demands')
      .select('*')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5)
    demandasRecentes = (data as Demand[]) ?? []
  }

  const stats = [
    { label: 'Total de Demandas', value: statsData.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Em Andamento', value: statsData.em_andamento, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Concluídas', value: statsData.concluido, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pendentes', value: statsData.nova_solicitacao, icon: AlertCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Faturas em Aberto', value: statsData.faturasAbertas, icon: CreditCard, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {profile.name.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {profile.organization?.name} — Painel de demandas
          </p>
        </div>
        <Link href="/cliente/demandas/criar">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Solicitar Nova Diligência
          </Button>
        </Link>
      </div>

      {IS_DEMO_MODE && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
          Modo demonstração — dados fictícios
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 leading-tight">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`rounded-lg p-2 ${stat.bg}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Demandas Recentes</CardTitle>
            <Link href="/cliente/demandas">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {demandasRecentes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Nenhuma demanda ainda.</p>
              <Link href="/cliente/demandas/nova">
                <Button size="sm" className="mt-3">Criar primeira demanda</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {demandasRecentes.map((demand) => (
                <div key={demand.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-gray-400">{demand.protocol_number}</span>
                      <UrgencyBadge urgency={demand.urgency} />
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate mt-0.5">
                      {DEMAND_TYPE_LABELS[demand.demand_type]} — {demand.city}/{demand.state}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(demand.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={demand.status} />
                    <Link href={`/cliente/demandas/${demand.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Como funciona?</p>
        <p className="text-blue-700">
          Após o envio da solicitação, nossa equipe entrará em contato via WhatsApp ou e-mail para
          negociar os detalhes e o valor. O acompanhamento completo é feito aqui no painel.
        </p>
      </div>
    </div>
  )
}
