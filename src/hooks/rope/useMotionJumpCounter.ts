'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MotionJumpCounter, MOTION_ALGORITHM_VERSION } from '@/lib/rope/motionCountingEngine'

export type MotionPermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'

interface UseMotionJumpCounterOptions {
  active: boolean
  onJump: (count: number, timestamp: number) => void
}

type DeviceMotionEventWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

/**
 * Comptage de sauts par accéléromètre du téléphone — pertinent uniquement
 * si le téléphone est tenu en main ou porté en brassard pendant la
 * séance. Un téléphone posé au sol ne produit aucune accélération
 * exploitable : cette méthode n'est donc jamais proposée comme
 * fonctionnant dans ce cas (voir l'écran de choix de méthode).
 */
export function useMotionJumpCounter({ active, onJump }: UseMotionJumpCounterOptions) {
  const counterRef = useRef<MotionJumpCounter>(new MotionJumpCounter())
  const onJumpRef = useRef(onJump)
  onJumpRef.current = onJump

  const [permission, setPermission] = useState<MotionPermissionState>('idle')
  const [jumpCount, setJumpCount] = useState(0)
  const [calibrated, setCalibrated] = useState(false)

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || typeof DeviceMotionEvent === 'undefined') {
      setPermission('unsupported')
      return
    }
    const EventWithPermission = DeviceMotionEvent as DeviceMotionEventWithPermission
    if (typeof EventWithPermission.requestPermission === 'function') {
      setPermission('requesting')
      try {
        const result = await EventWithPermission.requestPermission()
        setPermission(result === 'granted' ? 'granted' : 'denied')
      } catch {
        setPermission('denied')
      }
      return
    }
    // Android et navigateurs sans API de permission explicite : l'accès aux capteurs est déjà disponible.
    setPermission('granted')
  }, [])

  const reset = useCallback(() => {
    counterRef.current.reset()
    setJumpCount(0)
    setCalibrated(false)
  }, [])

  const pause = useCallback(() => counterRef.current.pause(), [])
  const resume = useCallback(() => counterRef.current.resume(), [])

  useEffect(() => {
    if (!active || permission !== 'granted') return

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return
      const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z)
      const jumpAt = counterRef.current.pushSample({ t: performance.now(), magnitude })
      setCalibrated(counterRef.current.calibrated)
      if (jumpAt !== null) {
        const count = counterRef.current.jumpCount
        setJumpCount(count)
        onJumpRef.current(count, jumpAt)
      }
    }

    window.addEventListener('devicemotion', handleMotion)
    return () => window.removeEventListener('devicemotion', handleMotion)
  }, [active, permission])

  return {
    permission,
    jumpCount,
    calibrated,
    algorithmVersion: MOTION_ALGORITHM_VERSION,
    requestPermission,
    reset,
    pause,
    resume,
  }
}
