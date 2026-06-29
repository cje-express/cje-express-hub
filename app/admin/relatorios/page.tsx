import { BarChart3, FileText, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getServerProfile } from '@/lib/server-session'
import { IS_DEMO_MODE, DEMO_STATS_ADMIN } from '@/lib/demo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function AdminRelatoriosPage() {
  await getServerProfile()

  let totalDemandas = DEMO_STATS_ADMIN.total
  let concluidas = DEMO_STATS_ADMIN.concluido
  let totalClientes = 3

  if (!IS_DEMO_MODE) {
    const supabase = await createClient()

    const [
      { count: td },
      { count: cc },
      { count: tc },
    ] = await Promise.all([
      supabase.from('demands').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('demands').select('*', { count: 'exact', head: true }).eq('status', 'concluido').is('deleted_at', null),
      supabase.from('organizations').select('*', { count: 'exact', head: true }).neq('type', 'interno').eq('status', 'active'),
    ])

    totalDemandas = td ?? 0
    concluidas = cc ?? 0
    totalClientes = tc ?? 0
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral e exportações</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">Total de Demandas</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalDemandas ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">Demandas Concluídas</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{concluidas ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">Clientes Ativos</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{totalClientes ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Export options */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              Relatório de Demandas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Exporte um relatório completo de todas as demandas por período.
            </p>
            <Button variant="outline" className="gap-2 w-full" disabled>
              <Download className="h-4 w-4" />
              Exportar em PDF
            </Button>
            <p className="text-xs text-gray-400 text-center">Em breve</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-400" />
              Relatório Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Exporte relatório financeiro com faturas e valores por período.
            </p>
            <Button variant="outline" className="gap-2 w-full" disabled>
              <Download className="h-4 w-4" />
              Exportar em PDF
            </Button>
            <p className="text-xs text-gray-400 text-center">Em breve</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Módulo de relatórios PDF</p>
        <p>
          Os relatórios individuais de cada demanda estão disponíveis nas páginas de detalhe.
          Os relatórios globais em PDF estão em desenvolvimento.
        </p>
      </div>
    </div>
  )
}
