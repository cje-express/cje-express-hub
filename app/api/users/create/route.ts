import { NextRequest, NextResponse } from 'next/server'
import { getServerProfile } from '@/lib/server-session'
import { createServiceClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  phone?: string
  role: UserRole
  organization_id: string
}

export async function POST(req: NextRequest) {
  try {
    const profile = await getServerProfile()
    if (!['SUPER_ADMIN_CJE', 'OPERADOR_CJE'].includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const body: CreateUserPayload = await req.json()
    const { name, email, password, phone, role, organization_id } = body

    if (!name || !email || !password || !role || !organization_id) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
    }

    // Service role: bypasses email confirmation requirement
    const supabase = await createServiceClient()

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,   // skip email verification — admin is creating this account
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message ?? 'Erro ao criar conta de acesso.' },
        { status: 500 }
      )
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      auth_user_id: authData.user.id,
      organization_id,
      name,
      email,
      phone: phone || null,
      role,
    })

    if (profileError) {
      // Rollback auth user so DB and auth stay in sync
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, userId: authData.user.id })
  } catch (err) {
    console.error('create user error:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
