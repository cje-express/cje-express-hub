import Link from 'next/link'
import { Building2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getServerProfile } from '@/lib/server-session'
import { IS_DEMO_MODE } from '@/lib/demo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { ORGANIZATION_TYPE_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Organization } from '@/types'

export default async function AdminClientesPage() {
  await getServerProfile()

  let organizations: any[] | null = []

  if (!IS_DEMO_MODE) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .neq('type', 'interno')
      .order('name')
    organizations = data
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {organizations?.length ?? 0} cliente(s) cadastrado(s)
          </p>
        </div>
        <Link href="/admin/clientes/novo">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo cliente
          </Button>
        </Link>
      </div>

      {!organizations || organizations.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum cliente cadastrado"
          description="Cadastre o primeiro cliente para começar."
          action={
            <Link href="/admin/clientes/novo">
              <Button>Cadastrar cliente</Button>
            </Link>
          }
        />
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">CNPJ/CPF</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Cidade/UF</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(organizations as Organization[]).map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{org.name}</p>
                    {org.corporate_name && org.corporate_name !== org.name && (
                      <p className="text-xs text-gray-400">{org.corporate_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-gray-600">
                      {ORGANIZATION_TYPE_LABELS[org.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs font-mono text-gray-500">{org.cnpj_cpf ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-gray-500">
                      {org.city ? `${org.city}/${org.state}` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                        org.status === 'active'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      )}
                    >
                      {org.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/clientes/${org.id}`}>
                      <Button size="sm" variant="outline">Ver</Button>
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
