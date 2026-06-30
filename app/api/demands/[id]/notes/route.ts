import { NextRequest, NextResponse } from 'next/server'
import { getServerProfile } from '@/lib/server-session'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const profile = await getServerProfile()
    const { notes } = await req.json()

    const supabase = await createServiceClient()

    // Verify the demand belongs to the user's organization
    const { data: demand } = await supabase
      .from('demands')
      .select('id, organization_id')
      .eq('id', id)
      .single()

    if (!demand || demand.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Demanda não encontrada.' }, { status: 404 })
    }

    const { error } = await supabase
      .from('demands')
      .update({ client_notes: notes ?? null })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('notes PATCH error:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
