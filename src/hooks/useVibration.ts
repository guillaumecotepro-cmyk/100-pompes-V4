'use client'
import { useCallback } from 'react'

export function useVibration() {
  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator

  const vibrateRep = useCallback(() => {
    if (canVibrate) navigator.vibrate(30)
  }, [canVibrate])

  const vibrateRest = useCallback(() => {
    if (canVibrate) navigator.vibrate([60, 30, 60])
  }, [canVibrate])

  const vibrateComplete = useCallback(() => {
    if (canVibrate) navigator.vibrate([100, 50, 100, 50, 200])
  }, [canVibrate])

  const vibrateError = useCallback(() => {
    if (canVibrate) navigator.vibrate([50, 30, 50])
  }, [canVibrate])

  return { vibrateRep, vibrateRest, vibrateComplete, vibrateError }
}
