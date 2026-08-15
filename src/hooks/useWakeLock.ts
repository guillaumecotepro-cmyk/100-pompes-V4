'use client'
import { useEffect, useRef } from 'react'

/**
 * Empêche la mise en veille de l'écran pendant `active`, via la Screen Wake
 * Lock API. Feature-detecté : sans support (ex. anciens iOS Safari), l'app
 * reste utilisable, simplement l'écran pourra s'éteindre pendant une séance
 * — limitation de plateforme documentée, pas une erreur silencieuse.
 */
export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return
    let cancelled = false

    async function acquire() {
      try {
        const lock = await (navigator as Navigator & { wakeLock: { request: (type: 'screen') => Promise<WakeLockSentinel> } }).wakeLock.request('screen')
        if (cancelled) { void lock.release(); return }
        lockRef.current = lock
      } catch {
        // Refusé par la plateforme (hors gestes utilisateur, batterie faible…) — non bloquant.
      }
    }

    async function release() {
      try {
        await lockRef.current?.release()
      } catch { /* déjà relâché */ }
      lockRef.current = null
    }

    if (active) {
      void acquire()
      const onVisible = () => {
        if (document.visibilityState === 'visible' && active && !lockRef.current) void acquire()
      }
      document.addEventListener('visibilitychange', onVisible)
      return () => {
        cancelled = true
        document.removeEventListener('visibilitychange', onVisible)
        void release()
      }
    }

    void release()
    return () => { cancelled = true }
  }, [active])
}
