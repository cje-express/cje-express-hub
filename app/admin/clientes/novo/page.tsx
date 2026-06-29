'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ChevronLeft, Loader2 } from 'lucide-react'
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

      // 2. Create auth user (via signUp)
      if (data.admin_password) {
        const { data: authData, error: authError } = await supabase.auth.admin
          ? await supabase.auth.signUp({ email: data.admin_email, password: data.admin_password })
          : { data: null, error: { message: 'Use Supabase dashboard or service role' } }

        if (!authError && authData?.user) {
          await supabase.from('profiles').insert({
            auth_user_id: authData.user.id,
            organization_id: org.id,
            name: data.admin_name,
            email: data.admin_email,
            role: 'ADMIN_CLIENTE',
          })
        }
      }

      toast.success('Cliente cadastrado com sucesso!')
      router.push(`/admin/clientes/${org.id}`)
    } finally {
      setIsLoading(false)
    }
  }

  const orgTypes = Object.entries(ORGANIZATION_TYPE_LABELS).filter(([k]) => k !== 'interno')

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
