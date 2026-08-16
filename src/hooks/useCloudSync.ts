'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AppData } from '@/types'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

interface UseCloudSyncOptions {
  data: AppData
  hydrated: boolean
}

/**
 * Synchronisation cloud optionnelle : no-op complet si Supabase n'est pas
 * configuré (isSupabaseConfigured === false). Le localStorage reste la seule
 * source de vérité ; le cloud n'est qu'une sauvegarde/restauration.
 *
 * Stratégie de conflit volontairement simple : le plus récent (updatedAt)
 * gagne. Si le cloud est plus récent qu'au chargement, on propose (on
 * n'impose jamais) de charger ces données via `cloudAvailable`.
 */
export function useCloudSync({ data, hydrated }: UseCloudSyncOptions) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [cloudAvailable, setCloudAvailable] = useState<AppData | null>(null)
  const pushTimer = useRef<ReturnType<typeof setTimeout>>()
  const pulledOnceRef = useRef(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const supabase = getSupabaseClient()!
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const push = useCallback(async (payload: AppData) => {
    if (!isSupabaseConfigured || !session) return
    const supabase = getSupabaseClient()!
    setStatus('syncing')
    const { error } = await supabase
      .from('app_data')
      .upsert({ user_id: session.user.id, data: payload, updated_at: new Date().toISOString() })
    if (error) { setStatus('error'); return }
    setStatus('synced')
    setLastSyncedAt(new Date().toISOString())
  }, [session])

  const pull = useCallback(async () => {
    if (!isSupabaseConfigured || !session) return
    const supabase = getSupabaseClient()!
    setStatus('syncing')
    const { data: row, error } = await supabase
      .from('app_data')
      .select('data, updated_at')
      .eq('user_id', session.user.id)
      .maybeSingle()
    if (error) { setStatus('error'); return }
    if (row?.data) {
      const cloud = row.data as AppData
      const cloudIsNewer = !data.updatedAt || (cloud.updatedAt != null && new Date(cloud.updatedAt) > new Date(data.updatedAt))
      if (cloudIsNewer) setCloudAvailable(cloud)
    }
    setStatus('synced')
  }, [session, data.updatedAt])

  // Un seul pull automatique, à la connexion.
  useEffect(() => {
    if (session && !pulledOnceRef.current) {
      pulledOnceRef.current = true
      pull()
    }
    if (!session) pulledOnceRef.current = false
  }, [session, pull])

  // Push débouncé à chaque changement local, uniquement si connecté.
  useEffect(() => {
    if (!hydrated || !session) return
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => { push(data) }, 3000)
    return () => clearTimeout(pushTimer.current)
  }, [data, hydrated, session, push])

  const signInWithEmail = useCallback(async (email: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) return { error: 'La synchronisation cloud n\'est pas configurée sur ce déploiement.' }
    const supabase = getSupabaseClient()!
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/account` : undefined },
    })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return
    await getSupabaseClient()!.auth.signOut()
    setLastSyncedAt(null)
  }, [])

  const acceptCloudData = useCallback((apply: (d: AppData) => void) => {
    if (!cloudAvailable) return
    apply(cloudAvailable)
    setCloudAvailable(null)
  }, [cloudAvailable])

  const dismissCloudData = useCallback(() => setCloudAvailable(null), [])

  return {
    isConfigured: isSupabaseConfigured,
    session,
    status,
    lastSyncedAt,
    cloudAvailable,
    signInWithEmail,
    signOut,
    pushNow: () => push(data),
    acceptCloudData,
    dismissCloudData,
  }
}
