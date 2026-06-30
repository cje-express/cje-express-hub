'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Loader2, Lock, Mail, CheckCircle, Zap,
  FileText, Gavel, Building2, Stamp, Search, Users,
  MessageCircle, ArrowRight, ChevronRight, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WHATSAPP_URL, WHATSAPP_MESSAGE } from '@/lib/constants'

const IS_DEMO = !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co') ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

const solicitarSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  comarca: z.string().optional(),
  info: z.string().optional(),
})

type SolicitarForm = z.infer<typeof solicitarSchema>

export function LandingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [showSolicitarModal, setShowSolicitarModal] = useState(false)
  const [solicitarSent, setSolicitarSent] = useState(false)
  const [solicitarLoading, setSolicitarLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const {
    register: regSolicitar,
    handleSubmit: handleSolicitar,
    reset: resetSolicitar,
    formState: { errors: errorsSolicitar },
  } = useForm<SolicitarForm>({ resolver: zodResolver(solicitarSchema) })

  async function onSolicitar(data: SolicitarForm) {
    setSolicitarLoading(true)
    try {
      const res = await fetch('/api/solicitar-cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json()
        toast.error(json.error ?? 'Erro ao enviar solicitação.')
        return
      }
      setSolicitarSent(true)
    } catch {
      toast.error('Erro ao enviar. Tente novamente.')
    } finally {
      setSolicitarLoading(false)
    }
  }

  function closeSolicitarModal() {
    setShowSolicitarModal(false)
    setSolicitarSent(false)
    resetSolicitar()
  }

  async function onLogin(data: LoginForm) {
    setIsLoading(true)
    try {
      if (IS_DEMO) {
        const res = await fetch('/api/demo-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, password: data.password }),
        })
        const json = await res.json()
        if (!res.ok) { toast.error(json.error ?? 'Credenciais inválidas.'); return }
        router.push(json.role === 'SUPER_ADMIN_CJE' || json.role === 'OPERADOR_CJE' ? '/admin/dashboard' : '/cliente/dashboard')
        router.refresh()
        return
      }
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
      if (error) { toast.error('Credenciais inválidas.'); return }
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('auth_user_id', user.id).single()
        router.push(profile?.role === 'SUPER_ADMIN_CJE' || profile?.role === 'OPERADOR_CJE' ? '/admin/dashboard' : '/cliente/dashboard')
        router.refresh()
      }
    } finally { setIsLoading(false) }
  }

  const services = [
    { icon: FileText, label: 'Cópias' },
    { icon: Gavel, label: 'Audiências' },
    { icon: Stamp, label: 'Protocolos' },
    { icon: Building2, label: 'Despachos' },
    { icon: Search, label: 'Diligências' },
    { icon: Users, label: 'Prepostos' },
  ]

  const advantages = [
    {
      title: 'Qualidade garantida',
      desc: 'Profissional especializado em diligências e comparecimento a audiências, com atividades executadas com excelência e prazo estimado.',
    },
    {
      title: 'Redução de custos',
      desc: 'Em vez de manter uma equipe fixa, contrate um correspondente para demandas específicas. Atuação em diversas regiões do país, sem viagens.',
    },
    {
      title: 'Aumento de produtividade',
      desc: 'Permite que seus advogados se concentrem em tarefas importantes e otimizem seu tempo, enquanto cuidamos da parte operacional.',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('/images/bg-white.jpg')` }} />

        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div className="space-y-8">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-[#0a1f44] leading-[1.08] tracking-tight">
                Precisando de Correspondente Jurídico e Advogado para Realização de Diligência ?
              </h1>

              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-2.5 shadow-lg shadow-green-500/20">
                <Zap className="h-4 w-4 text-white" />
                <span className="text-sm font-bold text-white">Resposta em até 5 minutos</span>
              </div>

              <p className="text-lg text-[#0a1f44]/80 leading-relaxed max-w-lg">
                Sua solução confiável e Referência em Apoio Jurídico em todas as comarcas do Brasil.{' '}
                <strong className="text-[#0a1f44]">Resolvemos sua Diligência em Até 24 Horas.</strong>
              </p>

              {/* Feature pills - blue gradient style */}
              <div className="flex flex-wrap gap-4">
                {['Diligência no\nMesmo Dia', 'Resolva sua\nDemanda Hoje', 'Advogados em\n100% do Brasil.'].map((text) => (
                  <div
                    key={text}
                    className="flex items-center justify-center rounded-xl bg-gradient-to-r from-[#006497] to-[#094882] px-6 py-4 shadow-lg shadow-[#094882]/30 min-w-[160px] cursor-default hover:shadow-xl hover:shadow-[#094882]/40 transition-shadow"
                  >
                    <span className="text-sm font-bold text-white text-center whitespace-pre-line leading-tight">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Login/Register Card */}
            <div className="w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto">
              <div className="rounded-3xl bg-gradient-to-b from-[#006497] to-[#094882] shadow-2xl shadow-blue-900/40 overflow-hidden">
                {/* Logo */}
                <div className="flex justify-center pt-6 pb-3">
                  <img src="/icons/logo-cje-white.png" alt="CJE" className="h-20 w-auto" />
                </div>

                {/* Tabs */}
                <div className="flex mx-4 rounded-lg overflow-hidden bg-white/20 backdrop-blur-sm">
                  <button
                    onClick={() => setTab('login')}
                    className={`flex-1 py-3 text-sm font-semibold transition-all ${
                      tab === 'login'
                        ? 'bg-white/30 text-white'
                        : 'text-white/60 hover:text-white/80'
                    }`}
                  >
                    Entrar na plataforma
                  </button>
                  <button
                    onClick={() => setTab('register')}
                    className={`flex-1 py-3 text-sm font-semibold transition-all ${
                      tab === 'register'
                        ? 'bg-white/30 text-white'
                        : 'text-white/60 hover:text-white/80'
                    }`}
                  >
                    Solicitar cadastro
                  </button>
                </div>

                <div className="p-6 pt-5">
                  {tab === 'login' ? (
                    <form onSubmit={handleSubmit(onLogin)} className="space-y-5">
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md bg-[#094882] flex items-center justify-center">
                          <Mail className="h-4 w-4 text-white" />
                        </div>
                        <Input
                          type="email"
                          placeholder="Email"
                          className="pl-14 h-14 rounded-xl bg-white border-0 text-[#094882] font-medium placeholder:text-[#094882]/40 text-base focus-visible:ring-2 focus-visible:ring-white/50"
                          {...register('email')}
                        />
                        {errors.email && <p className="text-red-300 text-xs mt-1">{errors.email.message}</p>}
                      </div>

                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md bg-[#094882] flex items-center justify-center">
                          <Lock className="h-4 w-4 text-white" />
                        </div>
                        <Input
                          type="password"
                          placeholder="Senha"
                          className="pl-14 h-14 rounded-xl bg-white border-0 text-[#094882] font-medium placeholder:text-[#094882]/40 text-base focus-visible:ring-2 focus-visible:ring-white/50"
                          {...register('password')}
                        />
                        {errors.password && <p className="text-red-300 text-xs mt-1">{errors.password.message}</p>}
                      </div>

                      <div className="flex justify-end">
                        <Link href="/forgot-password" className="text-xs text-white/60 hover:text-white/90 font-medium">
                          Esqueci minha senha
                        </Link>
                      </div>

                      <button type="submit" disabled={isLoading} style={{ borderColor: '#ffffff' }} className="w-full h-12 rounded-full border-2 bg-transparent hover:bg-white/10 text-white font-bold text-base tracking-wide flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</> : 'Entrar'}
                      </button>

                      {IS_DEMO && (
                        <div className="rounded-xl bg-white/10 border border-white/20 p-3 text-xs text-white/80 space-y-0.5">
                          <p className="font-bold text-white">Modo demonstração</p>
                          <p>Admin: <span className="font-mono text-white/90">admin@cje.com.br</span> / <span className="font-mono">Admin@123</span></p>
                          <p>Cliente: <span className="font-mono text-white/90">cliente@teste.com.br</span> / <span className="font-mono">Cliente@123</span></p>
                        </div>
                      )}
                    </form>
                  ) : (
                    <div className="space-y-5">
                      <p className="text-white/70 text-sm text-center">
                        Preencha seus dados para solicitar acesso à plataforma CJE Express.
                      </p>
                      <button
                        onClick={() => setShowSolicitarModal(true)}
                        style={{ borderColor: '#ffffff' }}
                        className="w-full h-12 rounded-full border-2 bg-transparent hover:bg-white/10 text-white font-bold text-base tracking-wide flex items-center justify-center gap-2 transition-colors"
                      >
                        Solicitar cadastro <ArrowRight className="h-4 w-4" />
                      </button>
                      <a
                        href={`${WHATSAPP_URL}?text=${encodeURIComponent('Olá, gostaria de solicitar acesso à plataforma CJE Express.')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="w-full h-12 mt-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium gap-2 border-0">
                          <MessageCircle className="h-4 w-4 text-green-400" />
                          Falar pelo WhatsApp
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ SERVIÇOS ══════════ */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f2342] to-[#0a1f44]">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url('/images/bg-lawyers.jpg')` }} />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628]/80 via-[#0f2342]/70 to-[#0a1f44]/80" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 items-start">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white uppercase tracking-wide mb-8">
                Nossos Serviços
              </h2>

              <div className="grid grid-cols-3 gap-6 mb-10">
                {[
                  { icon: '/icons/copias.svg', label: 'Cópias' },
                  { icon: '/icons/prepostos.svg', label: 'Audiências' },
                  { icon: '/icons/protocolos.svg', label: 'Protocolos' },
                  { icon: '/icons/despachos.svg', label: 'Despachos' },
                  { icon: '/icons/delegacias.svg', label: 'Delegacias' },
                  { icon: '/icons/prepostos.svg', label: 'Visitas' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className="rounded-lg bg-white/10 p-2.5">
                      <img src={s.icon} alt={s.label} className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-bold text-white">{s.label}</span>
                  </div>
                ))}
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-6">
                Seu Apoio Estratégico em Audiências e Diligências
              </h3>

              <div className="space-y-4 text-sm text-white/70 leading-relaxed">
                <p>
                  Bem-vindo à <strong className="text-white">Correspondente Jurídico Express</strong>, sua solução confiável para correspondência jurídica.
                </p>
                <p>
                  Somos uma empresa <strong className="text-white">especializada em Diligências</strong> para escritórios de advocacia e profissionais do direito em todo o país.
                </p>
                <p>
                  Nossa equipe experiente prepara e envia documentos jurídicos, notificações e petições em conformidade com os prazos e requisitos legais. <strong className="text-white">Valorizamos a privacidade e segurança dos dados de nossos clientes</strong> e estamos comprometidos em exceder suas expectativas.
                </p>
                <p className="text-emerald-400 font-semibold">
                  Entre em contato conosco hoje mesmo para descobrir como podemos ajudá-lo em suas demandas jurídicas!
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center lg:pt-12">
              <img src="/icons/logo-cje-white.png" alt="CJE Correspondente Jurídico Express" className="h-72 w-auto mx-auto -mb-6" />

              <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                <Button size="lg" className="bg-gradient-to-r from-[#006497] to-[#094882] hover:from-[#005580] hover:to-[#083d6e] text-white font-bold px-12 h-12 rounded-full uppercase tracking-wider text-sm shadow-lg shadow-[#094882]/30">
                  Solicitar Diligência
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ VANTAGENS ══════════ */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('/images/bg-white.jpg')` }} />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 items-center">
            <div className="flex flex-col items-center text-center lg:pt-12">
              <img src="/icons/logo-cje-color.png" alt="CJE Correspondente Jurídico Express" className="h-72 w-auto mx-auto -mb-6" />

              <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                <Button size="lg" className="bg-gradient-to-r from-[#006497] to-[#094882] hover:from-[#005580] hover:to-[#083d6e] text-white font-bold px-10 h-12 rounded-full uppercase tracking-wider text-sm shadow-lg shadow-[#094882]/30">
                  Orçamento Online
                </Button>
              </a>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a1f44] leading-tight mb-8">
                Vantagens de Contratar um Correspondente Jurídico Profissional
              </h2>

              <div className="space-y-6">
                {advantages.map((a) => (
                  <div key={a.title} className="flex gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#1a56db] to-[#0ea5e9] flex items-center justify-center shadow-md shadow-[#094882]/30">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-[#0a1f44] mb-1">{a.title}</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="relative bg-[#0a1628] py-20 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-15" style={{ backgroundImage: `url('/images/bg-legal.png')` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/90 via-[#0a1628]/70 to-[#0a1628]/90" />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Envie sua <span className="text-[#0ea5e9]">Diligência</span> que retornamos em até 05 minutos
          </h2>
          <p className="text-white/60 mt-4 max-w-xl mx-auto">
            Informe todos os dados da sua diligência para que possamos retornar já iniciando todo o processo.
          </p>

          <div className="mt-8">
            <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
              <Button size="lg" className="bg-gradient-to-r from-[#006497] to-[#094882] hover:from-[#005580] hover:to-[#083d6e] text-white font-bold px-8 h-12 rounded-full uppercase tracking-wider text-sm shadow-lg shadow-[#094882]/30 gap-2">
                Cadastre sua diligência aqui
                <ChevronRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="bg-[#060d19] py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-2">
          <p className="text-white/40 text-xs">
            Todos os direitos reservados &copy; Correspondente Jurídico Express, 2024.
          </p>
          <p className="text-white/30 text-xs">
            CJE SERVICOS DE APOIO ADMNISTRATIVO LTDA CNPJ: 54.787.995/0001-01
          </p>
          <p className="text-white/30 text-xs">
            Endereço: R Jurubatuba Nº1350 Cep: 09725-000 — Centro — São Bernardo — SP
          </p>
        </div>
      </footer>

      {/* ══════════ MODAL SOLICITAR CADASTRO ══════════ */}
      {showSolicitarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeSolicitarModal} />

          {/* Card */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#006497] to-[#094882] px-6 py-5 text-center">
              <h2 className="text-xl font-bold text-white">Cadastre sua Diligência Abaixo</h2>
              <p className="text-white/70 text-sm mt-0.5">Resposta Imediata</p>
              <button
                onClick={closeSolicitarModal}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-6">
              {solicitarSent ? (
                <div className="text-center py-6 space-y-4">
                  <CheckCircle className="h-14 w-14 text-green-500 mx-auto" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Solicitação enviada!</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Nossa equipe entrará em contato em breve para dar andamento ao seu cadastro.
                    </p>
                  </div>
                  <button
                    onClick={closeSolicitarModal}
                    className="w-full h-11 rounded-lg bg-gradient-to-r from-[#006497] to-[#094882] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSolicitar(onSolicitar)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nome :</label>
                    <input
                      type="text"
                      placeholder="Seu nome:"
                      className="w-full h-10 px-4 rounded-lg border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006497]/30 focus:border-[#006497]"
                      {...regSolicitar('name')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      E-mail : <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Seu e-mail"
                      className="w-full h-10 px-4 rounded-lg border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006497]/30 focus:border-[#006497]"
                      {...regSolicitar('email')}
                    />
                    {errorsSolicitar.email && (
                      <p className="text-red-500 text-xs mt-1">{errorsSolicitar.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Celular :</label>
                    <input
                      type="tel"
                      placeholder="Seu Whatsapp"
                      className="w-full h-10 px-4 rounded-lg border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006497]/30 focus:border-[#006497]"
                      {...regSolicitar('phone')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Qual Comarca ? :</label>
                    <input
                      type="text"
                      placeholder="Qual Comarca será realizada a diligência ?"
                      className="w-full h-10 px-4 rounded-lg border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006497]/30 focus:border-[#006497]"
                      {...regSolicitar('comarca')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Informações sobre a Diligência :</label>
                    <textarea
                      placeholder="Nos dê uma breve explicação sobre a sua Diligência."
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006497]/30 focus:border-[#006497] resize-none"
                      {...regSolicitar('info')}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={solicitarLoading}
                    className="w-full h-11 rounded-lg bg-[#2196f3] hover:bg-[#1976d2] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                  >
                    {solicitarLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />Enviando...</>
                    ) : (
                      'Enviar Solicitação de Diligência'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
