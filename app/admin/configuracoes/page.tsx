import { redirect } from 'next/navigation'
import { getServerProfile } from '@/lib/server-session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserRoleBadge } from '@/components/common/UserRoleBadge'
import { ProfilePhotoSection } from '@/components/common/ProfilePhotoSection'
import { formatDate } from '@/lib/utils'

export default async function AdminConfiguracoesPage() {
  const p = await getServerProfile()
  if (p.role !== 'SUPER_ADMIN_CJE') redirect('/admin/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-0.5">Informações do administrador e da empresa</p>
      </div>

      {/* Foto de perfil */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Foto de Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfilePhotoSection
            userId={p.id}
            userName={p.name}
            currentAvatarUrl={p.avatar_url}
          />
        </CardContent>
      </Card>

      {/* Meu Perfil + CJE Express lado a lado */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Meu Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoField label="Nome" value={p.name} />
            <InfoField label="E-mail" value={p.email} />
            <InfoField label="Telefone" value={p.phone ?? '—'} />
            <InfoField label="Perfil" value={<UserRoleBadge role={p.role} />} />
            <InfoField label="Conta criada em" value={formatDate(p.created_at)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">CJE Express</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoField label="Razão Social" value="CJE SERVICOS DE APOIO ADMNISTRATIVO LTDA" />
            <InfoField label="CNPJ" value="54.787.995/0001-01" />
            <InfoField label="WhatsApp" value="+55 11 98213-1799" />
            <InfoField label="Cidade/UF" value="São Bernardo do Campo / SP" />
            <InfoField label="CEP" value="09725-000" />
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        <p className="font-medium mb-1">Sistema</p>
        <p>CJE Express Hub v1.0 — MVP</p>
        <p className="mt-1 text-gray-400">
          Para alterar configurações do sistema, entre em contato com o suporte técnico.
        </p>
      </div>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <div className="text-sm text-gray-800 mt-0.5">{value}</div>
    </div>
  )
}
