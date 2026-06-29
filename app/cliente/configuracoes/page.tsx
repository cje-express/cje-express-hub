import { getServerProfile } from '@/lib/server-session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserRoleBadge } from '@/components/common/UserRoleBadge'
import { ProfilePhotoSection } from '@/components/common/ProfilePhotoSection'
import { ChangePasswordForm } from '@/components/common/ChangePasswordForm'
import { ORGANIZATION_TYPE_LABELS } from '@/lib/constants'
import { formatDate, formatDateTime } from '@/lib/utils'
import { KeyRound, Clock } from 'lucide-react'

export default async function ClienteConfiguracoesPage() {
  const p = await getServerProfile()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-0.5">Informações da sua conta</p>
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

      {/* Dados Pessoais + Organização lado a lado */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoField label="Nome" value={p.name} />
            <InfoField label="E-mail" value={p.email} />
            <InfoField label="Telefone" value={p.phone ?? '—'} />
            <InfoField label="Perfil" value={<UserRoleBadge role={p.role} />} />
            <InfoField label="Conta criada em" value={formatDate(p.created_at)} />
          </CardContent>
        </Card>

        {p.organization && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dados da Organização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoField label="Nome" value={p.organization.name} />
              <InfoField label="Razão Social" value={p.organization.corporate_name ?? '—'} />
              <InfoField label="CNPJ/CPF" value={p.organization.cnpj_cpf ?? '—'} />
              <InfoField label="Tipo" value={ORGANIZATION_TYPE_LABELS[p.organization.type]} />
              <InfoField label="E-mail" value={p.organization.email ?? '—'} />
              <InfoField label="Telefone" value={p.organization.phone ?? '—'} />
              {p.organization.city && (
                <InfoField label="Cidade/Estado" value={`${p.organization.city}/${p.organization.state}`} />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Alterar senha + Último acesso */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-blue-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-blue-600" />
              Alterar minha senha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          {/* Último acesso */}
          <Card className="border-gray-200 bg-gray-50/50">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-100 p-2.5">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Último acesso</p>
                  <p className="text-lg font-semibold text-gray-800 mt-1">
                    {p.last_login_at ? formatDateTime(p.last_login_at) : 'Primeiro acesso'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Registrado automaticamente a cada login
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info de atualização */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-medium mb-1">Atualizar dados</p>
            <p>Para atualizar seus dados cadastrais, entre em contato com a equipe CJE Express.</p>
          </div>
        </div>
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
