'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ProfilePhotoUpload } from './ProfilePhotoUpload'
import { useAvatar } from '@/hooks/useAvatar'
import { IS_DEMO_MODE } from '@/lib/demo'

interface ProfilePhotoSectionProps {
  userId: string
  userName: string
  currentAvatarUrl: string | null
}

export function ProfilePhotoSection({ userId, userName, currentAvatarUrl }: ProfilePhotoSectionProps) {
  const { avatarUrl: demoAvatarUrl, uploadAvatar: demoUpload, removeAvatar: demoRemove } = useAvatar(userId)
  const [realAvatarUrl, setRealAvatarUrl] = useState<string | null>(currentAvatarUrl)

  async function uploadAvatar(file: File): Promise<string | null> {
    if (IS_DEMO_MODE) return demoUpload(file)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}))
      toast.error(error ?? 'Erro ao enviar foto.')
      return null
    }
    const { url } = await res.json()
    setRealAvatarUrl(url)
    return url
  }

  async function removeAvatar() {
    if (IS_DEMO_MODE) { demoRemove(); return }
    await fetch('/api/profile/avatar', { method: 'DELETE' })
    setRealAvatarUrl(null)
  }

  const avatarUrl = IS_DEMO_MODE ? (demoAvatarUrl ?? currentAvatarUrl) : realAvatarUrl

  return (
    <ProfilePhotoUpload
      name={userName}
      avatarUrl={avatarUrl}
      onUpload={uploadAvatar}
      onRemove={removeAvatar}
    />
  )
}
