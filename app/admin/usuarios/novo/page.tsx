'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ChevronLeft, Loader2, UserPlus, FileDown, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { IS_DEMO_MODE } from '@/lib/demo'
import { USER_ROLE_LABELS, ORGANIZATION_TYPE_LABELS } from '@/lib/constants'
import { downloadCredentialsPdf } from '@/lib/pdf-credentials'
import type { UserRole } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  role: z.enum(['ADMIN_CLIENTE', 'OPERADOR_CLIENTE', 'OPERADOR_CJE']),
  organization_id: z.string().optional(),
  new_org_name: z.string().optional(),
  new_org_type: z.string().optional(),
  new_org_cnpj: z.string().optional(),
  org_mode: z.enum(['existing', 'new']),
})

type FormData = z.infer<typeof schema>

const CLIENT_ROLES: { value: string; label: string }[] = [
  { value: 'ADMIN_CLIENTE', label: 'Admin Cliente — acesso total ao painel do cliente' },
  { value: 'OPERADOR_CLIENTE', label: 'Operador Cliente — acesso limitado' },
  { value: 'OPERADOR_CJE', label: 'Operador CJE — acesso ao painel administrativo' },
]

export default function NovoUsuarioPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([])
  const [created, setCreated] = useState<{ name: string; email: string; password: string; org: string; role: string } | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'ADMIN_CLIENTE', org_mode: 'existing' },
  })

  const orgMode = watch('org_mode')
  const selectedRole = watch('role')
  const isCJERole = selectedRole === 'OPERADOR_CJE'

  useEffect(() => {
    if (IS_DEMO_MODE) {
      setOrganizations([
        { id: 'demo-org-cliente', name: 'Escritório Demo Advogados' },
        { id: 'demo-org-2', name: 'Empresa Jurídica ABC' },
        { id: 'demo-org-3', name: 'Imobiliária Centro' },
      ])
      return
    }
    async function loadOrgs() {
      const { data } = await supabase
        .from('organizations')
        .select('id, name')
        .neq('type', 'interno')
        .eq('status', 'active')
        .order('name')
      setOrganizations(data ?? [])
    }
    loadOrgs()
  }, [])

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    try {
      if (IS_DEMO_MODE) {
        setCreated({
          name: data.name,
          email: data.email,
          password: data.password,
          org: data.new_org_name ?? 'Demo Org',
          role: USER_ROLE_LABELS[data.role] ?? data.role,
        })
        toast.success(`Usuário "${data.name}" criado com sucesso! (demo)`)
        return
      }

      let orgId = data.organization_id

      if (!isCJERole && data.org_mode === 'new' && data.new_org_name) {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: data.new_org_name,
            type: data.new_org_type || 'outro',
            cnpj_cpf: data.new_org_cnpj || null,
            email: data.email,
          })
          .select()
          .single()

        if (orgError) {
          toast.error('Erro ao criar organização.')
          return
        }
        orgId = org.id
      }

      if (isCJERole) {
        const { data: cjeOrg } = await supabase
          .from('organizations')
          .select('id')
          .eq('type', 'interno')
          .single()
        orgId = cjeOrg?.id
      }

      if (!orgId) {
        toast.error('Selecione ou crie uma organização.')
        return
      }

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      })

      if (authError || !authData.user) {
        toast.error(authError?.message ?? 'Erro ao criar conta de acesso.')
        return
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        auth_user_id: authData.user.id,
        organization_id: orgId,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        role: data.role as UserRole,
      })

      if (profileError) {
        toast.error('Conta criada, mas houve erro no perfil. Verifique no Supabase.')
        return
      }

      const orgName = isCJERole
        ? 'CJE Express'
        : organizations.find((o) => o.id === orgId)?.name ?? data.new_org_name ?? ''

      setCreated({
        name: data.name,
        email: data.email,
        password: data.password,
        org: orgName,
        role: USER_ROLE_LABELS[data.role] ?? data.role,
      })
      toast.success(`Usuário "${data.name}" criado com sucesso!`)
    } catch {
      toast.error('Erro inesperado. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const orgTypes = Object.entries(ORGANIZATION_TYPE_LABELS).filter(([k]) => k !== 'interno')

  if (created) {
    return (
      <div className="max-w-lg mx-auto mt-10 space-y-6">
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#006497] to-[#094882] px-6 py-5 flex items-center gap-3">
            <CheckCircle2 className="h-7 w-7 text-white flex-shrink-0" />
            <div>
              <h2 className="text-lg font-bold text-white">Usuário criado com sucesso!</h2>
              <p className="text-white/70 text-sm">Baixe o PDF com os dados de acesso</p>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="rounded-xl bg-gray-50 border divide-y text-sm">
              {[
                { label: 'Nome', value: created.name },
                { label: 'Organização', value: created.org },
                { label: 'Perfil', value: created.role },
                { label: 'E-mail (login)', value: created.email },
                { label: 'Senha inicial', value: created.password },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between px-4 py-2.5 gap-4">
                  <span className="text-gray-500 shrink-0">{label}</span>
                  <span className={`font-medium text-right truncate ${label === 'Senha inicial' ? 'font-mono text-blue-700 bg-blue-50 px-2 rounded' : 'text-gray-800'}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
              Guarde este documento em local seguro. Após o primeiro login, oriente o usuário a alterar a senha.
            </div>
          </div>

          <div className="px-6 pb-6 flex flex-col gap-3">
            <Button
              className="w-full gap-2 bg-gradient-to-r from-[#006497] to-[#094882] text-white hover:opacity-90"
              disabled={pdfLoading}
              onClick={async () => {
                setPdfLoading(true)
                await downloadCredentialsPdf({
                  name: created.name,
                  email: created.email,
                  password: created.password,
                  organization: created.org,
                  role: created.role,
                })
                setPdfLoading(false)
              }}
            >
              {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Baixar PDF com dados de acesso
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push('/admin/usuarios')}>
              Ir para lista de usuários
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/usuarios">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Usuário</h1>
          <p className="text-sm text-gray-500">Cadastrar um cliente ou operador na plataforma</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Dados pessoais */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nome completo *</Label>
                <Input id="name" placeholder="Nome do usuário" {...register('name')} />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" type="email" placeholder="email@empresa.com.br" {...register('email')} />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" placeholder="(11) 99999-9999" {...register('phone')} />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="password">Senha inicial *</Label>
                <Input id="password" type="password" placeholder="Mínimo 8 caracteres" {...register('password')} />
                {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                <p className="text-xs text-gray-400">O usuário poderá alterar a senha após o primeiro login.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Perfil de acesso */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Perfil de Acesso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de acesso *</Label>
              <Select
                defaultValue="ADMIN_CLIENTE"
                onValueChange={(v) => setValue('role', v as FormData['role'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isCJERole && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                Este usuário será vinculado automaticamente à organização CJE Express e terá acesso ao painel administrativo.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organização (só para roles de cliente) */}
        {!isCJERole && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Organização do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={orgMode === 'existing' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setValue('org_mode', 'existing')}
                >
                  Cliente existente
                </Button>
                <Button
                  type="button"
                  variant={orgMode === 'new' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setValue('org_mode', 'new')}
                >
                  Nova organização
                </Button>
              </div>

              {orgMode === 'existing' ? (
                <div className="space-y-2">
                  <Label>Selecione o cliente</Label>
                  <Select onValueChange={(v) => setValue('organization_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma organização" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome da empresa / escritório *</Label>
                    <Input placeholder="Razão social ou nome fantasia" {...register('new_org_name')} />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select onValueChange={(v) => setValue('new_org_type', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {orgTypes.map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>CNPJ / CPF</Label>
                      <Input placeholder="00.000.000/0001-00" {...register('new_org_cnpj')} />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-3">
          <Link href="/admin/usuarios">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={isLoading} className="gap-2">
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Criando...</>
            ) : (
              <><UserPlus className="h-4 w-4" />Criar usuário</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
