import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerProfile } from '@/lib/server-session'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getServerProfile()
    if (!['SUPER_ADMIN_CJE', 'OPERADOR_CJE'].includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const { status } = await req.json()
    if (!status) {
      return NextResponse.json({ error: 'Status obrigatório.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('registration_requests')
      .update({ status })
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('registration-requests PATCH error:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
