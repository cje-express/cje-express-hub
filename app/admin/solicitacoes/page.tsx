import { getServerProfile } from '@/lib/server-session'
import { createClient } from '@/lib/supabase/server'
import { IS_DEMO_MODE } from '@/lib/demo'
import { ClipboardList } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { SolicitacoesList } from './SolicitacoesList'

export default async function SolicitacoesPage() {
  await getServerProfile()

  let pendentes: any[] = []
  let concluidos: any[] = []

  if (!IS_DEMO_MODE) {
    const supabase = await createClient()

    const { data: pend } = await supabase
      .from('registration_requests')
      .select('*')
      .in('status', ['pendente', 'em_analise'])
      .order('created_at', { ascending: false })

    const { data: conc } = await supabase
      .from('registration_requests')
      .select('*')
      .in('status', ['aprovado', 'recusado'])
      .order('created_at', { ascending: false })
      .limit(50)

    pendentes = pend ?? []
    concluidos = conc ?? []
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
        <SolicitacoesList pendentes={pendentes} concluidos={concluidos} />
      )}
    </div>
  )
}
