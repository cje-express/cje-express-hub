'use client'

import { useState, useEffect, useCallback } from 'react'

const AVATAR_STORAGE_KEY = 'cje_demo_avatars'

function getDemoAvatars(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(AVATAR_STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function setDemoAvatar(userId: string, dataUrl: string) {
  const avatars = getDemoAvatars()
  avatars[userId] = dataUrl
  localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(avatars))
}

export function useAvatar(userId: string | undefined) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    const avatars = getDemoAvatars()
    if (avatars[userId]) {
      setAvatarUrl(avatars[userId])
    }
  }, [userId])

  const uploadAvatar = useCallback(async (file: File) => {
    if (!userId) return null

    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })

    setDemoAvatar(userId, dataUrl)
    setAvatarUrl(dataUrl)
    return dataUrl
  }, [userId])

  const removeAvatar = useCallback(() => {
    if (!userId) return
    const avatars = getDemoAvatars()
    delete avatars[userId]
    localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(avatars))
    setAvatarUrl(null)
  }, [userId])

  return { avatarUrl, uploadAvatar, removeAvatar }
}

export function getStoredAvatarUrl(userId: string): string | null {
  const avatars = getDemoAvatars()
  return avatars[userId] ?? null
}
