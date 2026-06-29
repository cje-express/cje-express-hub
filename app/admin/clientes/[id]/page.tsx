import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FileText, Users, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getServerProfile } from '@/lib/server-session'
import { IS_DEMO_MODE } from '@/lib/demo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { UserRoleBadge } from '@/components/common/UserRoleBadge'
import { ORGANIZATION_TYPE_LABELS, DEMAND_TYPE_LABELS } from '@/lib/constants'
import { formatDate, formatCurrency, getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Organization, Profile, Demand } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminClienteDetailPage({ params }: Props) {
  const { id } = await params
  await getServerProfile()

  let organization: Organization
  let members: any[] | null = []
  let demands: any[] | null = []
  let invoices: any[] | null = []

  if (IS_DEMO_MODE) {
    notFound()
  } else {
    const supabase = await createClient()

    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (!org) notFound()

    const [{ data: m }, { data: d }, { data: inv }] = await Promise.all([
      supabase.from('profiles').select('*').eq('organization_id', id).order('created_at'),
      supabase.from('demands').select('*').eq('organization_id', id).is('deleted_at', null).order('created_at', { ascending: false }).limit(5),
      supabase.from('invoices').select('*').eq('organization_id', id).order('created_at', { ascending: false }).limit(5),
    ])

    organization = org as Organization
    members = m
    demands = d
    invoices = inv
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/clientes">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-gray-500">
              {ORGANIZATION_TYPE_LABELS[organization.type]}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                organization.status === 'active'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}
            >
              {organization.status === 'active' ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dados da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {organization.corporate_name && (
                <Field label="Razão social" value={organization.corporate_name} />
              )}
              {organization.cnpj_cpf && (
                <Field label="CNPJ/CPF" value={organization.cnpj_cpf} mono />
              )}
              {organization.email && <Field label="E-mail" value={organization.email} />}
              {organization.phone && <Field label="Telefone" value={organization.phone} />}
              {organization.whatsapp && <Field label="WhatsApp" value={organization.whatsapp} />}
              {organization.city && (
                <Field label="Cidade/UF" value={`${organization.city}/${organization.state}`} />
              )}
              {organization.address && <Field label="Endereço" value={organization.address} />}
              {organization.zip_code && <Field label="CEP" value={organization.zip_code} />}
              <Field label="Desde" value={formatDate(organization.created_at)} />
            </CardContent>
          </Card>
        </div>

        {/* Right side */}
        <div className="lg:col-span-2 space-y-4">
          {/* Team */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  Usuários ({members?.length ?? 0})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {!members || members.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">Nenhum usuário.</p>
              ) : (
                <div className="space-y-2">
                  {(members as Profile[]).map((m) => (
                    <div key={m.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-gray-100">
                          {getInitials(m.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-400">{m.email}</p>
                      </div>
                      <UserRoleBadge role={m.role} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent demands */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  Demandas Recentes
                </CardTitle>
                <Link href={`/admin/demandas?org=${id}`}>
                  <Button variant="ghost" size="sm" className="text-xs">Ver todas</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {!demands || demands.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">Nenhuma demanda.</p>
              ) : (
                <div className="divide-y">
                  {(demands as Demand[]).map((d) => (
                    <div key={d.id} className="flex items-center justify-between py-2 gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono text-gray-400">{d.protocol_number}</p>
                        <p className="text-sm text-gray-800">
                          {DEMAND_TYPE_LABELS[d.demand_type]} — {d.city}/{d.state}
                        </p>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  Faturas
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {!invoices || invoices.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">Nenhuma fatura.</p>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-mono font-medium text-gray-700">{inv.invoice_number}</p>
                        <p className="text-xs text-gray-400">Venc: {formatDate(inv.due_date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(inv.total_amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className={`text-sm text-gray-800 mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
