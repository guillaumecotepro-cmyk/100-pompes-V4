'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { SensorMode, RhythmQuality } from '@/types'

interface UsePushupCounterOptions {
  mode: SensorMode
  active: boolean
  onRep: (count: number) => void
}

interface CounterState {
  count: number
  rhythmQuality: RhythmQuality
  sensorReady: boolean
  accelerometerPermission: 'unknown' | 'granted' | 'denied' | 'unavailable'
}

const MIN_REP_INTERVAL_MS = 400

// ─── Accelerometer ───────────────────────────────────────────────────────────
// Phone on user's back: gravity Z ≈ 9.8 at rest.
// During push-up the net vertical acceleration changes.
// We smooth the signal and look for down→up threshold crossings.

const ACC_SMOOTH = 0.3        // EMA factor for raw signal
const ACC_BASELINE_SAMPLES = 40
const ACC_THRESHOLD = 3.0     // deviation from baseline to trigger state change

// ─── Camera proximity ────────────────────────────────────────────────────────
// Front camera aimed up from the floor:
// as the user's face approaches, average frame brightness increases.
const BRIGHTNESS_HISTORY = 8
const BRIGHTNESS_THRESHOLD = 15  // brightness change to register a peak

export function usePushupCounter({ mode, active, onRep }: UsePushupCounterOptions) {
  const [state, setState] = useState<CounterState>({
    count: 0,
    rhythmQuality: 'idle',
    sensorReady: false,
    accelerometerPermission: 'unknown',
  })

  const countRef        = useRef(0)
  const lastRepTime     = useRef(0)
  const repTimings      = useRef<number[]>([])
  const smoothedAcc     = useRef(9.8)
  const baselineAcc     = useRef(9.8)
  const baselineSamples = useRef<number[]>([])
  const repState        = useRef<'up' | 'down'>('up')
  const cameraStream    = useRef<MediaStream | null>(null)
  const videoRef        = useRef<HTMLVideoElement | null>(null)
  const canvasRef       = useRef<HTMLCanvasElement | null>(null)
  const brightnessHist  = useRef<number[]>([])
  const brightPeak      = useRef<'high' | 'low'>('low')
  const animFrame       = useRef<number>(0)

  const addRep = useCallback(() => {
    const now = Date.now()
    if (now - lastRepTime.current < MIN_REP_INTERVAL_MS) return
    lastRepTime.current = now

    repTimings.current = [...repTimings.current.slice(-5), now]
    const quality = getQuality(repTimings.current)

    countRef.current += 1
    const newCount = countRef.current

    setState(s => ({ ...s, count: newCount, rhythmQuality: quality }))
    onRep(newCount)
  }, [onRep])

  const reset = useCallback(() => {
    countRef.current = 0
    lastRepTime.current = 0
    repTimings.current = []
    smoothedAcc.current = 9.8
    baselineAcc.current = 9.8
    baselineSamples.current = []
    repState.current = 'up'
    brightnessHist.current = []
    brightPeak.current = 'low'
    setState(s => ({ ...s, count: 0, rhythmQuality: 'idle' }))
  }, [])

  // ── Accelerometer mode ──────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'accelerometer' || !active) return

    let mounted = true

    const handleMotion = (e: DeviceMotionEvent) => {
      if (!mounted) return
      const z = e.accelerationIncludingGravity?.z ?? 0

      // Calibrate baseline from first N samples
      if (baselineSamples.current.length < ACC_BASELINE_SAMPLES) {
        baselineSamples.current.push(z)
        if (baselineSamples.current.length === ACC_BASELINE_SAMPLES) {
          const avg = baselineSamples.current.reduce((a, b) => a + b, 0) / ACC_BASELINE_SAMPLES
          baselineAcc.current = avg
          setState(s => ({ ...s, sensorReady: true }))
        }
        return
      }

      // Smooth the signal
      smoothedAcc.current = ACC_SMOOTH * z + (1 - ACC_SMOOTH) * smoothedAcc.current

      const diff = smoothedAcc.current - baselineAcc.current

      if (repState.current === 'up' && diff < -ACC_THRESHOLD) {
        repState.current = 'down'
      } else if (repState.current === 'down' && diff > -ACC_THRESHOLD / 2) {
        repState.current = 'up'
        addRep()
      }
    }

    const startAccelerometer = async () => {
      if (typeof DeviceMotionEvent === 'undefined') {
        setState(s => ({ ...s, accelerometerPermission: 'unavailable' }))
        return
      }
      // iOS 13+ requires explicit permission
      if (typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
        try {
          const perm = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission()
          if (perm !== 'granted') {
            setState(s => ({ ...s, accelerometerPermission: 'denied' }))
            return
          }
          setState(s => ({ ...s, accelerometerPermission: 'granted' }))
        } catch {
          setState(s => ({ ...s, accelerometerPermission: 'denied' }))
          return
        }
      } else {
        setState(s => ({ ...s, accelerometerPermission: 'granted' }))
      }
      window.addEventListener('devicemotion', handleMotion)
    }

    startAccelerometer()
    return () => {
      mounted = false
      window.removeEventListener('devicemotion', handleMotion)
    }
  }, [mode, active, addRep])

  // ── Camera mode ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'camera' || !active) return

    let mounted = true

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 160, height: 120 },
        })
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return }
        cameraStream.current = stream

        const video = document.createElement('video')
        video.srcObject = stream
        video.autoplay = true
        video.playsInline = true
        videoRef.current = video

        const canvas = document.createElement('canvas')
        canvas.width = 160
        canvas.height = 120
        canvasRef.current = canvas
        const ctx = canvas.getContext('2d')!

        setState(s => ({ ...s, sensorReady: true }))

        const analyzeFrame = () => {
          if (!mounted) return
          ctx.drawImage(video, 0, 0, 160, 120)
          const data = ctx.getImageData(0, 0, 160, 120).data
          let sum = 0
          for (let i = 0; i < data.length; i += 16) sum += (data[i] + data[i+1] + data[i+2]) / 3
          const brightness = sum / (data.length / 16)

          brightnessHist.current = [...brightnessHist.current.slice(-(BRIGHTNESS_HISTORY - 1)), brightness]

          if (brightnessHist.current.length >= BRIGHTNESS_HISTORY) {
            const avg = brightnessHist.current.reduce((a, b) => a + b, 0) / BRIGHTNESS_HISTORY
            const latest = brightness

            if (brightPeak.current === 'low' && latest > avg + BRIGHTNESS_THRESHOLD) {
              brightPeak.current = 'high'
            } else if (brightPeak.current === 'high' && latest < avg - BRIGHTNESS_THRESHOLD / 2) {
              brightPeak.current = 'low'
              addRep()
            }
          }

          animFrame.current = requestAnimationFrame(analyzeFrame)
        }

        video.onloadeddata = () => { animFrame.current = requestAnimationFrame(analyzeFrame) }
      } catch {
        setState(s => ({ ...s, sensorReady: false }))
      }
    }

    startCamera()
    return () => {
      mounted = false
      cancelAnimationFrame(animFrame.current)
      cameraStream.current?.getTracks().forEach(t => t.stop())
    }
  }, [mode, active, addRep])

  // ── Tap mode ────────────────────────────────────────────────────────────────
  // Tap mode is handled externally by calling addRep() from the UI component.
  useEffect(() => {
    if (mode === 'tap' && active) {
      setState(s => ({ ...s, sensorReady: true }))
    }
  }, [mode, active])

  return {
    count: state.count,
    rhythmQuality: state.rhythmQuality,
    sensorReady: state.sensorReady,
    accelerometerPermission: state.accelerometerPermission,
    addRep,
    reset,
  }
}

function getQuality(timings: number[]): RhythmQuality {
  if (timings.length < 2) return 'idle'
  const interval = timings[timings.length - 1] - timings[timings.length - 2]
  if (interval < 1200) return 'fast'
  if (interval < 2600) return 'good'
  return 'slow'
}

export async function requestAccelerometerPermission(): Promise<boolean> {
  if (typeof DeviceMotionEvent === 'undefined') return false
  const fn = (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission
  if (typeof fn !== 'function') return true // no permission needed
  try {
    const result = await fn()
    return result === 'granted'
  } catch {
    return false
  }
}
