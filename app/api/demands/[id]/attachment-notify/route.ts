import { NextRequest, NextResponse } from 'next/server'
import { getServerProfile } from '@/lib/server-session'
import { createServiceClient } from '@/lib/supabase/server'
import { notifyAdmins } from '@/lib/notify-admins'
import { IS_DEMO_MODE } from '@/lib/demo'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (IS_DEMO_MODE) return NextResponse.json({ ok: true })

  try {
    const { id } = await params
    const profile = await getServerProfile()
    const { fileName } = await req.json()

    const supabase = createServiceClient()

    const { data: demand } = await supabase
      .from('demands')
      .select('protocol_number, title, organization_id')
      .eq('id', id)
      .single()

    if (!demand || demand.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Demanda não encontrada.' }, { status: 404 })
    }

    await notifyAdmins(supabase, {
      title: '📎 Documento anexado pelo cliente',
      message: `${demand.protocol_number} — ${demand.title} | Arquivo: ${fileName} (${profile.name})`,
      type: 'documento_anexado',
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('attachment-notify error:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
