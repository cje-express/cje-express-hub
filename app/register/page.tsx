'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { ORGANIZATION_TYPE_LABELS } from '@/lib/constants'
import type { OrganizationType } from '@/types'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string(),
  orgName: z.string().min(2, 'Nome da empresa é obrigatório'),
  orgType: z.enum([
    'escritorio_advocacia',
    'empresa_juridico',
    'advogado_autonomo',
    'imobiliaria',
    'pessoa_fisica',
    'outro',
  ]),
  cnpjCpf: z.string().optional(),
  phone: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { orgType: 'escritorio_advocacia' },
  })

  async function onSubmit(data: RegisterForm) {
    setIsLoading(true)
    try {
      // 1. Criar organização
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.orgName,
          type: data.orgType,
          cnpj_cpf: data.cnpjCpf || null,
          phone: data.phone || null,
          email: data.email,
        })
        .select()
        .single()

      if (orgError) {
        toast.error('Erro ao criar organização. Tente novamente.')
        return
      }

      // 2. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })

      if (authError || !authData.user) {
        toast.error(authError?.message ?? 'Erro ao criar conta.')
        return
      }

      // 3. Criar profile
      const { error: profileError } = await supabase.from('profiles').insert({
        auth_user_id: authData.user.id,
        organization_id: org.id,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        role: 'ADMIN_CLIENTE',
      })

      if (profileError) {
        toast.error('Conta criada mas houve um erro no perfil. Contate o suporte.')
        return
      }

      toast.success('Cadastro realizado com sucesso! Verifique seu e-mail.')
      router.push('/login')
    } catch {
      toast.error('Erro inesperado. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const orgTypes = Object.entries(ORGANIZATION_TYPE_LABELS).filter(
    ([k]) => k !== 'interno'
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1b2d] via-[#1a2d4a] to-[#0f1b2d] flex items-center justify-center p-4">
      <div className="w-full max-w-lg py-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-500 mb-3">
            <span className="text-white font-bold text-lg">CJE</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Criar conta</h1>
          <p className="text-white/60 text-sm mt-1">CJE Express Hub</p>
        </div>

        <Card className="border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Nome */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name" className="text-white/80">Nome completo *</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                    {...register('name')}
                  />
                  {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@empresa.com.br"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                    {...register('email')}
                  />
                  {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white/80">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                    {...register('phone')}
                  />
                </div>

                {/* Senha */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                    {...register('password')}
                  />
                  {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
                </div>

                {/* Confirmar Senha */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white/80">Confirmar senha *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repita a senha"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword.message}</p>}
                </div>

                {/* Divisor */}
                <div className="sm:col-span-2 border-t border-white/10 pt-2">
                  <p className="text-white/60 text-xs font-medium uppercase tracking-wide">Dados da empresa</p>
                </div>

                {/* Tipo de organização */}
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-white/80">Tipo *</Label>
                  <Select
                    defaultValue="escritorio_advocacia"
                    onValueChange={(v) => setValue('orgType', v as RegisterForm['orgType'])}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {orgTypes.map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Nome da empresa */}
                <div className="space-y-2">
                  <Label htmlFor="orgName" className="text-white/80">Nome / Razão social *</Label>
                  <Input
                    id="orgName"
                    placeholder="Nome da empresa ou seu nome"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                    {...register('orgName')}
                  />
                  {errors.orgName && <p className="text-red-400 text-xs">{errors.orgName.message}</p>}
                </div>

                {/* CNPJ/CPF */}
                <div className="space-y-2">
                  <Label htmlFor="cnpjCpf" className="text-white/80">CNPJ / CPF</Label>
                  <Input
                    id="cnpjCpf"
                    placeholder="00.000.000/0001-00"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                    {...register('cnpjCpf')}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar conta'
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-white/50 text-sm">
                Já tem acesso?{' '}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                  Entrar
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
