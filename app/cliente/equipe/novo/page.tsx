'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ChevronLeft, Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  role: z.enum(['ADMIN_CLIENTE', 'OPERADOR_CLIENTE']),
})

type FormData = z.infer<typeof schema>

export default function NovoMembroPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'OPERADOR_CLIENTE' },
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    try {
      toast.success(`Membro "${data.name}" cadastrado com sucesso! Um e-mail de boas-vindas será enviado. (demo)`)
      router.push('/cliente/equipe')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/cliente/equipe">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Membro</h1>
          <p className="text-sm text-gray-500">Cadastrar um membro da sua equipe</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados do membro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome completo *</Label>
              <Input placeholder="Nome do membro" {...register('name')} />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>E-mail *</Label>
                <Input type="email" placeholder="email@empresa.com.br" {...register('email')} />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input placeholder="(11) 99999-9999" {...register('phone')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Senha inicial *</Label>
              <Input type="password" placeholder="Mínimo 8 caracteres" {...register('password')} />
              {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
              <p className="text-xs text-gray-400">O membro poderá alterar a senha nas configurações após o primeiro login.</p>
            </div>

            <div className="space-y-2">
              <Label>Permissão de acesso</Label>
              <Select defaultValue="OPERADOR_CLIENTE" onValueChange={(v) => setValue('role', v as FormData['role'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERADOR_CLIENTE">
                    Operador — pode criar demandas e acompanhar
                  </SelectItem>
                  <SelectItem value="ADMIN_CLIENTE">
                    Administrador — acesso total + gerenciar equipe
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          <p className="font-medium mb-1">Como funciona?</p>
          <p>O membro receberá um e-mail com os dados de acesso. Ele poderá criar e acompanhar demandas vinculadas à sua organização.</p>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/cliente/equipe">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={isLoading} className="gap-2">
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Cadastrando...</>
            ) : (
              <><UserPlus className="h-4 w-4" />Cadastrar membro</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
