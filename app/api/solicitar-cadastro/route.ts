import { NextRequest, NextResponse } from 'next/server'
import { IS_DEMO_MODE } from '@/lib/demo'

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, comarca, info } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
    }

    if (IS_DEMO_MODE) {
      return NextResponse.json({ ok: true })
    }

    // Service role bypassa RLS — necessário pois a rota é pública (sem sessão)
    const { createServiceClient } = await import('@/lib/supabase/server')
    const supabase = await createServiceClient()

    // Salva a solicitação
    const { error: insertError } = await supabase
      .from('registration_requests')
      .insert({ name, email, phone, comarca, info })

    if (insertError) {
      console.error('registration_requests insert error:', insertError)
      return NextResponse.json({ error: 'Erro ao salvar solicitação.' }, { status: 500 })
    }

    // Monta mensagem resumindo a solicitação
    const parts: string[] = []
    if (name) parts.push(`Nome: ${name}`)
    parts.push(`E-mail: ${email}`)
    if (phone) parts.push(`Celular: ${phone}`)
    if (comarca) parts.push(`Comarca: ${comarca}`)
    if (info) parts.push(`Info: ${info}`)
    const message = parts.join(' | ')

    // Busca super admins e operadores CJE para notificar
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['SUPER_ADMIN_CJE', 'OPERADOR_CJE'])
      .eq('status', 'active')

    if (admins && admins.length > 0) {
      await supabase.from('notifications').insert(
        admins.map((admin) => ({
          user_id: admin.id,
          title: '📋 Nova solicitação de cadastro',
          message,
          type: 'novo_cadastro',
          is_read: false,
        }))
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('solicitar-cadastro error:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
