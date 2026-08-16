'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { PoseJumpCounter, POSE_ALGORITHM_VERSION } from '@/lib/rope/poseCountingEngine'
import { loadPoseLandmarker } from '@/lib/rope/pose/landmarkerLoader'
import { diagnoseFraming, FramingIssue, mapLandmarksToPoseFrame, NormalizedLandmark, PreviousFrameState } from '@/lib/rope/pose/mapLandmarks'

export type CameraPermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'
export type CameraModelState = 'idle' | 'loading' | 'ready' | 'error'

export interface CameraDetectionStatus {
  bodyVisible: boolean
  confidence: number
  framingIssue: FramingIssue
}

interface UseCameraJumpCounterOptions {
  /** Le comptage n'est actif (et la boucle de détection ne consomme du CPU/GPU) que lorsque `active` est vrai. */
  active: boolean
  onJump: (count: number, timestamp: number) => void
}

/**
 * Comptage de sauts par analyse de pose caméra, 100% côté client :
 * la vidéo n'est jamais envoyée à un serveur, ni enregistrée, sauf
 * activation explicite (opt-in) d'un enregistrement de clip ailleurs
 * dans l'application. Le modèle est chargé une seule fois (mis en
 * cache par le module) et réutilisé entre les séances.
 */
export function useCameraJumpCounter({ active, onJump }: UseCameraJumpCounterOptions) {
  const videoElRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const counterRef = useRef<PoseJumpCounter>(new PoseJumpCounter())
  const prevFrameStateRef = useRef<PreviousFrameState | null>(null)
  const rafRef = useRef<number | null>(null)
  const modelLoadStartedRef = useRef(false)
  const onJumpRef = useRef(onJump)
  onJumpRef.current = onJump

  const [permission, setPermission] = useState<CameraPermissionState>('idle')
  const [modelState, setModelState] = useState<CameraModelState>('idle')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [jumpCount, setJumpCount] = useState(0)
  const [detection, setDetection] = useState<CameraDetectionStatus>({ bodyVisible: false, confidence: 0, framingIssue: null })
  const [lastLandmarks, setLastLandmarks] = useState<NormalizedLandmark[] | null>(null)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    if (videoElRef.current) videoElRef.current.srcObject = null
  }, [])

  /**
   * Attache le flux au `<video>` dès que les deux existent. Nécessaire car l'élément
   * `<video>` n'est monté par le composant plein écran qu'après que la méthode caméra
   * a été sélectionnée — au moment où `getUserMedia` se résout, il peut donc ne pas
   * encore exister. Cette fonction est appelée à la fois depuis la ref-callback (dès
   * que le nœud DOM apparaît) et juste après l'obtention du flux, quel que soit l'ordre.
   */
  const attachStreamIfReady = useCallback(() => {
    const video = videoElRef.current
    const stream = streamRef.current
    if (video && stream && video.srcObject !== stream) {
      video.srcObject = stream
      void video.play().catch(() => { /* lecture différée au geste utilisateur suivant si bloquée */ })
    }
  }, [])

  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    videoElRef.current = node
    if (node) attachStreamIfReady()
  }, [attachStreamIfReady])

  const requestPermission = useCallback(async (facingModeOverride?: 'user' | 'environment') => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setPermission('unsupported')
      return
    }
    setPermission('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingModeOverride ?? facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      attachStreamIfReady()
      setPermission('granted')
    } catch {
      // Refus explicite de l'utilisateur, ou aucune caméra disponible — jamais distingué à tort d'un vrai refus.
      setPermission('denied')
    }
  }, [facingMode, attachStreamIfReady])

  const switchCamera = useCallback(async () => {
    const next = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(next)
    stopStream()
    await requestPermission(next)
  }, [facingMode, stopStream, requestPermission])

  // Charge le modèle de pose une fois la permission caméra accordée.
  // Ne dépend QUE de `permission` : y inclure `modelState` déclencherait un
  // nettoyage de cet effet dès le passage à 'loading' (qu'il provoque lui-même),
  // qui marquerait la promesse en cours comme "annulée" avant sa résolution —
  // le modèle ne passerait alors jamais à 'ready'.
  useEffect(() => {
    if (permission !== 'granted' || modelLoadStartedRef.current) return
    modelLoadStartedRef.current = true
    let cancelled = false
    setModelState('loading')
    loadPoseLandmarker()
      .then(() => { if (!cancelled) setModelState('ready') })
      .catch(() => { if (!cancelled) setModelState('error') })
    return () => { cancelled = true }
  }, [permission])

  const reset = useCallback(() => {
    counterRef.current.reset()
    prevFrameStateRef.current = null
    setJumpCount(0)
  }, [])

  const pause = useCallback(() => counterRef.current.pause(), [])
  const resume = useCallback(() => counterRef.current.resume(), [])

  // Boucle de détection : une frame vidéo -> landmarks -> PoseFrame -> compteur, tant que `active`.
  useEffect(() => {
    if (!active || permission !== 'granted' || modelState !== 'ready') return
    let cancelled = false

    loadPoseLandmarker().then(landmarker => {
      const loop = () => {
        if (cancelled) return
        const video = videoElRef.current
        if (video && video.readyState >= 2) {
          const result = landmarker.detectForVideo(video, performance.now())
          const { frame, state, feetVisible } = mapLandmarksToPoseFrame(result.landmarks[0], performance.now(), prevFrameStateRef.current)
          prevFrameStateRef.current = state
          setDetection({ bodyVisible: frame.bodyVisible, confidence: frame.confidence, framingIssue: diagnoseFraming(frame, feetVisible) })
          setLastLandmarks(result.landmarks[0] ?? null)

          const jumpAt = counterRef.current.pushFrame(frame)
          if (jumpAt !== null) {
            const count = counterRef.current.jumpCount
            setJumpCount(count)
            onJumpRef.current(count, jumpAt)
          }
        }
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
    })

    return () => {
      cancelled = true
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [active, permission, modelState])

  useEffect(() => () => stopStream(), [stopStream])

  return {
    videoRef,
    videoElRef,
    permission,
    modelState,
    facingMode,
    detection,
    lastLandmarks,
    jumpCount,
    currentState: counterRef.current.currentState,
    algorithmVersion: POSE_ALGORITHM_VERSION,
    requestPermission,
    switchCamera,
    stopStream,
    reset,
    pause,
    resume,
  }
}
