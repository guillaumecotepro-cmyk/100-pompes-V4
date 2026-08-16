'use client'
import { useEffect, useRef } from 'react'
import { JumpRopeSettings } from '@/types/rope'
import { JumpRopeAudioEngine } from '@/lib/rope/audioEngine'

/** Instance stable du moteur audio Corde à sauter, tenue à jour avec les réglages courants. */
export function useJumpRopeAudio(settings: JumpRopeSettings) {
  const engineRef = useRef<JumpRopeAudioEngine | null>(null)
  if (!engineRef.current) engineRef.current = new JumpRopeAudioEngine(settings)

  useEffect(() => {
    engineRef.current?.updateSettings(settings)
  }, [settings])

  useEffect(() => () => engineRef.current?.stopAll(), [])

  return engineRef.current
}
