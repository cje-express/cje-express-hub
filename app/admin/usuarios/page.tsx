import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getServerProfile } from '@/lib/server-session'
import { IS_DEMO_MODE } from '@/lib/demo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { UserRoleBadge } from '@/components/common/UserRoleBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { getInitials, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const DEMO_PROFILES = [
  {
    id: 'demo-admin-001',
    name: 'Administrador CJE',
    email: 'admin@cje.com.br',
    phone: '(11) 98213-1799',
    role: 'SUPER_ADMIN_CJE',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    organization: { name: 'CJE Express' },
  },
  {
    id: 'demo-client-001',
    name: 'João Demo Silva',
    email: 'cliente@teste.com.br',
    phone: '(11) 99999-8888',
    role: 'ADMIN_CLIENTE',
    status: 'active',
    created_at: '2024-01-15T00:00:00Z',
    organization: { name: 'Escritório Demo Advogados' },
  },
  {
    id: 'demo-op-001',
    name: 'Maria Operadora',
    email: 'maria@demo-adv.com.br',
    phone: '(11) 98888-7777',
    role: 'OPERADOR_CLIENTE',
    status: 'active',
    created_at: '2024-02-10T00:00:00Z',
    organization: { name: 'Escritório Demo Advogados' },
  },
  {
    id: 'demo-op-cje',
    name: 'Carlos Operador CJE',
    email: 'carlos@cjeexpress.com.br',
    phone: '(11) 97777-6666',
    role: 'OPERADOR_CJE',
    status: 'active',
    created_at: '2024-03-01T00:00:00Z',
    organization: { name: 'CJE Express' },
  },
]

export default async function AdminUsuariosPage() {
  const profile = await getServerProfile()
  if (profile.role !== 'SUPER_ADMIN_CJE') redirect('/admin/dashboard')

  let profiles: any[] = DEMO_PROFILES

  if (!IS_DEMO_MODE) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*, organization:organizations(name)')
      .order('created_at', { ascending: false })
    profiles = data ?? []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {profiles.length} usuário(s) na plataforma
          </p>
        </div>
        <Link href="/admin/usuarios/novo">
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Usuário
          </Button>
        </Link>
      </div>

      {profiles.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum usuário"
          description="Cadastre o primeiro usuário da plataforma."
          action={
            <Link href="/admin/usuarios/novo">
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Cadastrar usuário
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Organização</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perfil</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Telefone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Desde</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {profiles.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-gray-100">
                          {getInitials(p.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm text-gray-600">{p.organization?.name ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <UserRoleBadge role={p.role} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-gray-500">{p.phone ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-gray-500">{formatDate(p.created_at)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                        p.status === 'active'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      )}
                    >
                      {p.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/usuarios/${p.id}`}>
                      <Button size="sm" variant="outline">Editar</Button>
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
