import { getServerProfile } from '@/lib/server-session'
import { createClient } from '@/lib/supabase/server'
import { IS_DEMO_MODE } from '@/lib/demo'
import { ClipboardList } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { SolicitacoesList } from './SolicitacoesList'

export default async function SolicitacoesPage() {
  await getServerProfile()

  let pendentes: any[] = []
  let emAnalise: any[] = []
  let concluidos: any[] = []
  let canceladas: any[] = []

  if (!IS_DEMO_MODE) {
    const supabase = await createClient()

    const { data: all } = await supabase
      .from('registration_requests')
      .select('*')
      .order('created_at', { ascending: false })

    const rows = all ?? []
    pendentes  = rows.filter((r) => r.status === 'pendente')
    emAnalise  = rows.filter((r) => r.status === 'em_analise')
    concluidos = rows.filter((r) => r.status === 'aprovado')
    canceladas = rows.filter((r) => r.status === 'recusado')
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Solicitações de Cadastro</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Gerencie os pedidos de acesso recebidos pela landing page
        </p>
      </div>

      {IS_DEMO_MODE ? (
        <EmptyState
          icon={ClipboardList}
          title="Disponível em ambiente real"
          description="As solicitações de cadastro aparecem aqui quando conectado ao banco de dados."
        />
      ) : (
        <SolicitacoesList
          pendentes={pendentes}
          emAnalise={emAnalise}
          concluidos={concluidos}
          canceladas={canceladas}
        />
      )}
    </div>
  )
}
