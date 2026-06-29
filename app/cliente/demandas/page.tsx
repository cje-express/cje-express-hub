import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { getServerProfile } from '@/lib/server-session'
import { IS_DEMO_MODE, DEMO_DEMANDS } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { DemandsViewSwitcher } from '@/components/demands/DemandsViewSwitcher'
import type { Demand } from '@/types'

export default async function ClienteDemandasPage() {
  const profile = await getServerProfile()

  let demands: Demand[] = []

  if (IS_DEMO_MODE) {
    demands = DEMO_DEMANDS.filter((d) => d.organization_id === profile.organization_id)
  } else {
    const supabase = await createClient()
    const { data } = await supabase
      .from('demands')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    demands = (data as Demand[]) ?? []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demandas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {demands.length} solicitação(ões) encontrada(s)
          </p>
        </div>
        <Link href="/cliente/demandas/criar">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Solicitar Nova Diligência
          </Button>
        </Link>
      </div>

      {demands.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma demanda ainda"
          description="Crie sua primeira solicitação para começar."
          action={
            <Link href="/cliente/demandas/nova">
              <Button>Criar demanda</Button>
            </Link>
          }
        />
      ) : (
        <DemandsViewSwitcher demands={demands} basePath="/cliente/demandas" />
      )}
    </div>
  )
}
