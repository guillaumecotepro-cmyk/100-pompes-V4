'use client'
import { useEffect, useRef } from 'react'
import { PlankSettings } from '@/types/plank'
import { PlankAudioEngine } from '@/lib/plank/audioEngine'

/** Instance stable du moteur audio Gainage, tenue à jour avec les réglages courants. */
export function usePlankAudio(settings: PlankSettings) {
  const engineRef = useRef<PlankAudioEngine | null>(null)
  if (!engineRef.current) engineRef.current = new PlankAudioEngine(settings)

  useEffect(() => {
    engineRef.current?.updateSettings(settings)
  }, [settings])

  useEffect(() => () => engineRef.current?.stopAll(), [])

  return engineRef.current
}
