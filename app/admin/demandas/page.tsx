import Link from 'next/link'
import { Plus, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getServerProfile } from '@/lib/server-session'
import { IS_DEMO_MODE, DEMO_DEMANDS } from '@/lib/demo'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { DemandsViewSwitcher } from '@/components/demands/DemandsViewSwitcher'
import type { Demand } from '@/types'

interface Props {
  searchParams: Promise<{ status?: string; urgency?: string; org?: string }>
}

export default async function AdminDemandasPage({ searchParams }: Props) {
  const params = await searchParams
  await getServerProfile()

  let demands: Demand[] = DEMO_DEMANDS as Demand[]

  if (!IS_DEMO_MODE) {
    const supabase = await createClient()

    let query = supabase
      .from('demands')
      .select(`
        *,
        organization:organizations(name),
        created_by:profiles!demands_created_by_user_id_fkey(name)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (params.status) query = query.eq('status', params.status)
    if (params.urgency) query = query.eq('urgency', params.urgency)
    if (params.org) query = query.eq('organization_id', params.org)

    const { data } = await query.limit(100)
    demands = (data as Demand[]) ?? []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demandas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {demands?.length ?? 0} demanda(s) encontrada(s)
            {params.status && ` · Filtrando por: ${params.status}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/demandas">
            {params.status || params.urgency ? (
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-3.5 w-3.5" />
                Limpar filtros
              </Button>
            ) : null}
          </Link>
          <Link href="/admin/demandas/nova">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Demanda
            </Button>
          </Link>
        </div>
      </div>

      {!demands || demands.length === 0 ? (
        <EmptyState
          title="Nenhuma demanda encontrada"
          description="Altere os filtros ou crie uma nova demanda."
        />
      ) : (
        <DemandsViewSwitcher demands={demands} basePath="/admin/demandas" isAdmin />
      )}
    </div>
  )
}
