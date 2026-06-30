import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { IS_DEMO_MODE } from '@/lib/demo'

export async function POST(req: NextRequest) {
  if (IS_DEMO_MODE) return NextResponse.json({ ok: true })

  try {
    const { demandId, title, protocol, orgName } = await req.json()
    const supabase = await createServiceClient()

    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['SUPER_ADMIN_CJE', 'OPERADOR_CJE'])
      .eq('status', 'active')

    if (admins && admins.length > 0) {
      await supabase.from('notifications').insert(
        admins.map((admin) => ({
          user_id: admin.id,
          title: '📋 Nova demanda recebida',
          message: `${protocol} — ${title} (${orgName})`,
          type: 'nova_demanda',
          is_read: false,
        }))
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('demand notify error:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
