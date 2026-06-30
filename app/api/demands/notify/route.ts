import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { IS_DEMO_MODE } from '@/lib/demo'
import { notifyAdmins } from '@/lib/notify-admins'

export async function POST(req: NextRequest) {
  if (IS_DEMO_MODE) return NextResponse.json({ ok: true })

  try {
    const { title, protocol, orgName } = await req.json()
    const supabase = createServiceClient()

    await notifyAdmins(supabase, {
      title: '📋 Nova demanda recebida',
      message: `${protocol} — ${title} (${orgName})`,
      type: 'nova_demanda',
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('demand notify error:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
