'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UsePlankTimerOptions {
  mode: 'countdown' | 'stopwatch'
  targetSeconds?: number
  running: boolean
  onTick?: (elapsedSeconds: number, remainingSeconds: number) => void
  onComplete?: () => void
}

/**
 * Minuteur monotone basé sur des timestamps (Date.now()), pas sur
 * l'accumulation de ticks : le temps réel est toujours recalculé depuis
 * l'ancrage de départ, donc aucune dérive ne s'accumule et l'affichage se
 * corrige tout seul après une pause, un passage en arrière-plan ou un
 * throttling du navigateur.
 */
export function usePlankTimer({ mode, targetSeconds = 0, running, onTick, onComplete }: UsePlankTimerOptions) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const baseElapsedMsRef = useRef(0)
  const runStartRef = useRef<number | null>(null)
  const lastWholeSecondRef = useRef(-1)
  const completedRef = useRef(false)
  const onTickRef = useRef(onTick)
  const onCompleteRef = useRef(onComplete)
  onTickRef.current = onTick
  onCompleteRef.current = onComplete

  const computeElapsedMs = useCallback(() => {
    if (runStartRef.current === null) return baseElapsedMsRef.current
    return baseElapsedMsRef.current + (Date.now() - runStartRef.current)
  }, [])

  useEffect(() => {
    if (running) {
      if (runStartRef.current === null) runStartRef.current = Date.now()
    } else if (runStartRef.current !== null) {
      baseElapsedMsRef.current += Date.now() - runStartRef.current
      runStartRef.current = null
    }
  }, [running])

  useEffect(() => {
    if (!running) return

    const tick = () => {
      const elapsedMs = computeElapsedMs()
      const elapsed = Math.floor(elapsedMs / 1000)
      const remaining = mode === 'countdown' ? Math.max(0, targetSeconds - elapsed) : 0

      if (elapsed !== lastWholeSecondRef.current) {
        lastWholeSecondRef.current = elapsed
        setElapsedSeconds(elapsed)
        onTickRef.current?.(elapsed, remaining)
        if (mode === 'countdown' && remaining <= 0 && !completedRef.current) {
          completedRef.current = true
          onCompleteRef.current?.()
        }
      }
    }

    tick()
    const interval = setInterval(tick, 200)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [running, mode, targetSeconds, computeElapsedMs])

  const reset = useCallback(() => {
    baseElapsedMsRef.current = 0
    runStartRef.current = running ? Date.now() : null
    lastWholeSecondRef.current = -1
    completedRef.current = false
    setElapsedSeconds(0)
  }, [running])

  const remainingSeconds = mode === 'countdown' ? Math.max(0, targetSeconds - elapsedSeconds) : 0

  return { elapsedSeconds, remainingSeconds, reset }
}
