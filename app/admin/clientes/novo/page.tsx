'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ChevronLeft, Loader2, FileDown, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { ORGANIZATION_TYPE_LABELS, BRAZIL_STATES } from '@/lib/constants'
import { downloadCredentialsPdf } from '@/lib/pdf-credentials'
import type { OrganizationType } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  corporate_name: z.string().optional(),
  cnpj_cpf: z.string().optional(),
  type: z.string(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  // Admin user
  admin_name: z.string().min(2, 'Nome do admin é obrigatório'),
  admin_email: z.string().email('E-mail inválido'),
  admin_password: z.string().min(8, 'Mínimo 8 caracteres').optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

export default function AdminNovoClientePage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [created, setCreated] = useState<{ name: string; email: string; password: string; org: string } | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'escritorio_advocacia' },
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    try {
      // 1. Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          corporate_name: data.corporate_name || null,
          cnpj_cpf: data.cnpj_cpf || null,
          type: data.type as OrganizationType,
          email: data.email || null,
          phone: data.phone || null,
          whatsapp: data.whatsapp || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zip_code: data.zip_code || null,
          status: 'active',
        })
        .select()
        .single()

      if (orgError || !org) {
        toast.error('Erro ao criar organização.')
        return
      }

      // 2. Create admin user via service role API (email_confirm: true — no confirmation email)
      if (data.admin_password) {
        const res = await fetch('/api/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.admin_name,
            email: data.admin_email,
            password: data.admin_password,
            role: 'ADMIN_CLIENTE',
            organization_id: org.id,
          }),
        })

        if (!res.ok) {
          const { error } = await res.json().catch(() => ({}))
          toast.error(error ?? 'Organização criada, mas erro ao criar usuário admin.')
          router.push(`/admin/clientes/${org.id}`)
          return
        }

        setCreated({
          name: data.admin_name,
          email: data.admin_email,
          password: data.admin_password,
          org: data.name,
        })
      } else {
        toast.success('Cliente cadastrado com sucesso!')
        router.push(`/admin/clientes/${org.id}`)
      }
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
              <h2 className="text-lg font-bold text-white">Cliente cadastrado com sucesso!</h2>
              <p className="text-white/70 text-sm">Baixe o PDF com os dados de acesso do administrador</p>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="rounded-xl bg-gray-50 border divide-y text-sm">
              {[
                { label: 'Empresa', value: created.org },
                { label: 'Administrador', value: created.name },
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
              Guarde este documento em local seguro. Oriente o cliente a alterar a senha após o primeiro acesso.
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
                  role: 'Admin Cliente',
                })
                setPdfLoading(false)
              }}
            >
              {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Baixar PDF com dados de acesso
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push('/admin/clientes')}>
              Ir para lista de clientes
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Cliente</h1>
          <p className="text-sm text-gray-500">Cadastrar cliente na plataforma</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Tipo *</Label>
              <Select
                defaultValue="escritorio_advocacia"
                onValueChange={(v) => setValue('type', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {orgTypes.map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Nome fantasia / Nome *</Label>
              <Input placeholder="Nome da empresa" {...register('name')} />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Razão social</Label>
              <Input placeholder="Razão social (opcional)" {...register('corporate_name')} />
            </div>

            <div className="space-y-2">
              <Label>CNPJ / CPF</Label>
              <Input placeholder="00.000.000/0001-00" {...register('cnpj_cpf')} />
            </div>

            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" placeholder="email@empresa.com.br" {...register('email')} />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input placeholder="(11) 3333-4444" {...register('phone')} />
            </div>

            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input placeholder="(11) 99999-9999" {...register('whatsapp')} />
            </div>

            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input placeholder="São Paulo" {...register('city')} />
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select onValueChange={(v) => setValue('state', v)}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {BRAZIL_STATES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Endereço</Label>
              <Input placeholder="Rua, número, complemento" {...register('address')} />
            </div>

            <div className="space-y-2">
              <Label>CEP</Label>
              <Input placeholder="00000-000" {...register('zip_code')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Usuário Administrador</CardTitle>
            <p className="text-xs text-gray-500">
              Crie um acesso para o administrador desta organização.
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nome *</Label>
              <Input placeholder="Nome do administrador" {...register('admin_name')} />
              {errors.admin_name && <p className="text-red-500 text-xs">{errors.admin_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>E-mail *</Label>
              <Input type="email" placeholder="admin@empresa.com.br" {...register('admin_email')} />
              {errors.admin_email && <p className="text-red-500 text-xs">{errors.admin_email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Senha (mínimo 8 caracteres)</Label>
              <Input type="password" placeholder="Senha inicial" {...register('admin_password')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2">
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Cadastrando...</>
            ) : (
              'Cadastrar cliente'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
