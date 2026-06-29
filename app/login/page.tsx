'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

const IS_DEMO = !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co') ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginForm) {
    setIsLoading(true)
    try {
      if (IS_DEMO) {
        const res = await fetch('/api/demo-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, password: data.password }),
        })
        const json = await res.json()
        if (!res.ok) {
          toast.error(json.error ?? 'Credenciais inválidas.')
          return
        }
        if (json.role === 'SUPER_ADMIN_CJE' || json.role === 'OPERADOR_CJE') {
          router.push('/admin/dashboard')
        } else {
          router.push('/cliente/dashboard')
        }
        router.refresh()
        return
      }

      // Supabase real
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) {
        toast.error('Credenciais inválidas. Verifique seu e-mail e senha.')
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('auth_user_id', user.id)
          .single()
        if (profile?.role === 'SUPER_ADMIN_CJE' || profile?.role === 'OPERADOR_CJE') {
          router.push('/admin/dashboard')
        } else {
          router.push('/cliente/dashboard')
        }
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1b2d] via-[#1a2d4a] to-[#0f1b2d] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-500 mb-4">
            <span className="text-white font-bold text-xl">CJE</span>
          </div>
          <h1 className="text-2xl font-bold text-white">CJE Express Hub</h1>
          <p className="text-white/60 text-sm mt-1">Logística Jurídica Administrativa</p>
        </div>

        <Card className="border-white/10 bg-white/[0.04] backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-2">
            <h2 className="text-xl font-semibold text-white text-center">Entrar na plataforma</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com.br"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-blue-400"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-blue-400"
                    {...register('password')}
                  />
                </div>
                {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
              </div>

              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Esqueci minha senha
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11"
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            {IS_DEMO && (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 space-y-1">
                <p className="font-semibold">Modo demonstração</p>
                <p>Super Admin: <span className="font-mono">admin@cje.com.br</span> / <span className="font-mono">Admin@123</span></p>
                <p>Operador CJE: <span className="font-mono">operador@cje.com.br</span> / <span className="font-mono">Operador@123</span></p>
                <p>Cliente: <span className="font-mono">cliente@teste.com.br</span> / <span className="font-mono">Cliente@123</span></p>
              </div>
            )}

            <div className="mt-4 text-center">
              <p className="text-white/50 text-sm">
                Ainda não tem acesso?{' '}
                <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  Solicitar cadastro
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-white/30 text-xs mt-6">
          CJE SERVICOS DE APOIO ADMNISTRATIVO LTDA — CNPJ 54.787.995/0001-01
        </p>
      </div>
    </div>
  )
}
