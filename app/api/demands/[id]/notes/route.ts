import { NextRequest, NextResponse } from 'next/server'
import { getServerProfile } from '@/lib/server-session'
import { createServiceClient } from '@/lib/supabase/server'
import { notifyAdmins } from '@/lib/notify-admins'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const profile = await getServerProfile()
    const { notes } = await req.json()

    const supabase = createServiceClient()

    const { data: demand } = await supabase
      .from('demands')
      .select('id, organization_id, protocol_number, title')
      .eq('id', id)
      .single()

    if (!demand || demand.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Demanda não encontrada.' }, { status: 404 })
    }

    const { data: updated, error } = await supabase
      .from('demands')
      .update({ client_notes: notes?.trim() || null })
      .eq('id', id)
      .select('id')

    if (error) {
      console.error('[notes PATCH] update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!updated || updated.length === 0) {
      console.error('[notes PATCH] 0 rows updated for demand:', id)
      return NextResponse.json({ error: 'Não foi possível salvar a observação.' }, { status: 500 })
    }

    // Notify admins
    await notifyAdmins(supabase, {
      title: '💬 Nova observação do cliente',
      message: `${demand.protocol_number} — ${demand.title} (${profile.name})`,
      type: 'documento_anexado',
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('notes PATCH error:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
