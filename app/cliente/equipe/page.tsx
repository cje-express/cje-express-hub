import Link from 'next/link'
import { Users, UserPlus } from 'lucide-react'
import { getServerProfile } from '@/lib/server-session'
import { IS_DEMO_MODE, DEMO_DEMANDS } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { TeamMemberCards } from './TeamMemberCards'

const DEMO_TEAM = [
  {
    id: 'demo-client-001',
    name: 'João Demo Silva',
    email: 'cliente@teste.com.br',
    phone: '(11) 99999-8888',
    role: 'ADMIN_CLIENTE' as const,
    status: 'active' as const,
    avatar_url: null,
    demandCount: 3,
  },
  {
    id: 'demo-op-cli-001',
    name: 'Ana Paula Ferreira',
    email: 'ana@demo-adv.com.br',
    phone: '(11) 98765-4321',
    role: 'OPERADOR_CLIENTE' as const,
    status: 'active' as const,
    avatar_url: null,
    demandCount: 5,
  },
  {
    id: 'demo-op-cli-002',
    name: 'Ricardo Mendes',
    email: 'ricardo@demo-adv.com.br',
    phone: '(11) 91234-5678',
    role: 'OPERADOR_CLIENTE' as const,
    status: 'active' as const,
    avatar_url: null,
    demandCount: 2,
  },
]

export default async function ClienteEquipePage() {
  const profile = await getServerProfile()
  const isAdmin = profile.role === 'ADMIN_CLIENTE'

  let teamMembers = DEMO_TEAM

  if (!IS_DEMO_MODE) {
    const supabase = await createClient()

    const { data: members } = await supabase
      .from('profiles')
      .select('id, name, email, phone, role, status, avatar_url')
      .eq('organization_id', profile.organization_id)
      .order('created_at')

    if (members) {
      const membersWithCount = await Promise.all(
        members.map(async (m: any) => {
          const { count } = await supabase
            .from('demands')
            .select('*', { count: 'exact', head: true })
            .eq('created_by_user_id', m.id)
            .is('deleted_at', null)
          return { ...m, demandCount: count ?? 0 }
        })
      )
      teamMembers = membersWithCount
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipe</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {teamMembers.length} membro(s) na sua organização
          </p>
        </div>
        {isAdmin && (
          <Link href="/cliente/equipe/novo">
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Novo membro
            </Button>
          </Link>
        )}
      </div>

      {teamMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum membro ainda"
          description="Cadastre membros da sua equipe para colaborar nas demandas."
          action={
            isAdmin ? (
              <Link href="/cliente/equipe/novo">
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Cadastrar membro
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <TeamMemberCards
          members={teamMembers}
          currentUserId={profile.id}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )
}
