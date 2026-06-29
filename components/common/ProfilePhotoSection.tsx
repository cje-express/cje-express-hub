'use client'

import { ProfilePhotoUpload } from './ProfilePhotoUpload'
import { useAvatar } from '@/hooks/useAvatar'

interface ProfilePhotoSectionProps {
  userId: string
  userName: string
  currentAvatarUrl: string | null
}

export function ProfilePhotoSection({ userId, userName, currentAvatarUrl }: ProfilePhotoSectionProps) {
  const { avatarUrl, uploadAvatar, removeAvatar } = useAvatar(userId)

  return (
    <ProfilePhotoUpload
      name={userName}
      avatarUrl={avatarUrl ?? currentAvatarUrl}
      onUpload={uploadAvatar}
      onRemove={removeAvatar}
    />
  )
}
