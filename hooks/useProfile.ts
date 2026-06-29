'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*, organization:organizations(*)')
        .eq('auth_user_id', user.id)
        .single()

      setProfile(data as Profile | null)
      setIsLoading(false)
    }

    fetchProfile()
  }, [supabase])

  return { profile, isLoading }
}
