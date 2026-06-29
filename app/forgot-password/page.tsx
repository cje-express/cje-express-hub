'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})

type FormData = z.infer<typeof schema>

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        toast.error('Erro ao enviar e-mail. Tente novamente.')
        return
      }

      setSent(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1b2d] via-[#1a2d4a] to-[#0f1b2d] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-500 mb-3">
            <span className="text-white font-bold text-lg">CJE</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Recuperar senha</h1>
          <p className="text-white/60 text-sm mt-1">CJE Express Hub</p>
        </div>

        <Card className="border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl">
          <CardContent className="pt-6">
            {sent ? (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold text-lg mb-2">E-mail enviado!</h3>
                <p className="text-white/60 text-sm mb-6">
                  Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </p>
                <Link href="/login">
                  <Button variant="outline" className="border-white/20 text-white/80 hover:bg-white/10">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao login
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <p className="text-white/60 text-sm mb-6">
                  Informe seu e-mail e enviaremos um link para redefinir sua senha.
                </p>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/80">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com.br"
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30"
                        {...register('email')}
                      />
                    </div>
                    {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
                  >
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
                    ) : (
                      'Enviar link de recuperação'
                    )}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm flex items-center justify-center gap-1">
                    <ArrowLeft className="h-3 w-3" />
                    Voltar ao login
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
