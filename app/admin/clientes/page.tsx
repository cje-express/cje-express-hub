import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getServerProfile } from '@/lib/server-session'
import { IS_DEMO_MODE } from '@/lib/demo'
import { Button } from '@/components/ui/button'
import { ClientesList } from './ClientesList'
import type { Organization } from '@/types'

const DEMO_ORGS: Organization[] = []

export default async function AdminClientesPage() {
  await getServerProfile()

  let organizations: Organization[] = DEMO_ORGS

  if (!IS_DEMO_MODE) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .neq('type', 'interno')
      .order('name')
    organizations = (data as Organization[]) ?? []
  }

  const ativos      = organizations.filter((o) => o.status === 'active').length
  const desativados = organizations.filter((o) => o.status !== 'active').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {ativos} ativo(s) · {desativados} desativado(s)
          </p>
        </div>
        <Link href="/admin/clientes/novo">
          <Button className="gap-2 bg-gradient-to-r from-[#006497] to-[#094882] text-white hover:opacity-90">
            <Plus className="h-4 w-4" />
            Novo cliente
          </Button>
        </Link>
      </div>

      <ClientesList organizations={organizations} />
    </div>
  )
}
