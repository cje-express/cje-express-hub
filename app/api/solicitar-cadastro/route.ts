import { NextRequest, NextResponse } from 'next/server'
import { IS_DEMO_MODE } from '@/lib/demo'

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, comarca, info } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
    }

    // Demo mode: just acknowledge
    if (IS_DEMO_MODE) {
      return NextResponse.json({ ok: true })
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Tenta salvar na tabela (se ela já existir após rodar migration 004)
    try {
      await supabase
        .from('registration_requests')
        .insert({ name, email, phone, comarca, info })
    } catch {
      // tabela ainda não existe — ignora e segue para notificação
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
      const notifications = admins.map((admin) => ({
        user_id: admin.id,
        title: '📋 Nova solicitação de cadastro',
        message,
        type: 'novo_cadastro',
        is_read: false,
      }))

      await supabase.from('notifications').insert(notifications)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('solicitar-cadastro error:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
