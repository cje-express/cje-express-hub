import { NextRequest, NextResponse } from 'next/server'
import { getServerProfile } from '@/lib/server-session'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const profile = await getServerProfile()
    const supabase = createServiceClient()

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${profile.id}/avatar.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

    // Add cache-busting suffix so browsers reload the new photo
    const avatarUrl = `${publicUrl}?t=${Date.now()}`

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', profile.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ url: avatarUrl })
  } catch (err) {
    console.error('avatar upload error:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const profile = await getServerProfile()
    const supabase = createServiceClient()

    // Try to remove all common extensions
    await supabase.storage.from('avatars').remove([
      `${profile.id}/avatar.jpg`,
      `${profile.id}/avatar.png`,
      `${profile.id}/avatar.webp`,
    ])

    await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile.id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
