import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerProfile } from '@/lib/server-session'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const profile = await getServerProfile()

    if (!['SUPER_ADMIN_CJE', 'OPERADOR_CJE'].includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const body = await req.json()
    const supabase = await createClient()

    const { error } = await supabase
      .from('organizations')
      .update(body)
      .eq('id', id)
      .neq('type', 'interno') // protege a organização interna

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('organizations PATCH error:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
