'use client'
import { useEffect, useRef } from 'react'
import { useCameraJumpCounter } from '@/hooks/rope/useCameraJumpCounter'

// Connexions du squelette BlazePose (indices utilisés par PoseLandmarker).
const SKELETON_CONNECTIONS: [number, number][] = [
  [11, 12], // épaules
  [11, 13], [13, 15], // bras gauche
  [12, 14], [14, 16], // bras droit
  [11, 23], [12, 24], [23, 24], // torse
  [23, 25], [25, 27], // jambe gauche
  [24, 26], [26, 28], // jambe droite
]
const SKELETON_POINTS = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]
const MIN_POINT_VISIBILITY = 0.4

interface CameraBackgroundProps {
  camera: ReturnType<typeof useCameraJumpCounter>
  /** N'affiche le fond plein écran que si la caméra est la méthode choisie ET la permission accordée. */
  active: boolean
}

/**
 * Fond vidéo plein écran + squelette de pose superposé, monté une seule
 * fois et gardé vivant tant que la caméra reste la méthode choisie —
 * qu'on soit sur l'écran de configuration ou en pleine séance. C'est ce
 * montage persistant qui permet à la boucle de détection de continuer à
 * lire des frames après la sélection de la méthode (un `<video>`
 * démonté coupait la détection).
 */
export function CameraBackground({ camera, active }: CameraBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) return
    let cancelled = false

    const draw = () => {
      if (cancelled) return
      const canvas = canvasRef.current
      const video = camera.videoElRef.current
      if (canvas && video && video.videoWidth > 0) {
        const cw = canvas.clientWidth
        const ch = canvas.clientHeight
        if (canvas.width !== cw) canvas.width = cw
        if (canvas.height !== ch) canvas.height = ch
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, cw, ch)
          const landmarks = camera.lastLandmarks
          if (landmarks) {
            const vw = video.videoWidth
            const vh = video.videoHeight
            const videoAspect = vw / vh
            const canvasAspect = cw / ch
            let scale: number, offsetX = 0, offsetY = 0
            if (videoAspect > canvasAspect) {
              scale = ch / vh
              offsetX = (cw - vw * scale) / 2
            } else {
              scale = cw / vw
              offsetY = (ch - vh * scale) / 2
            }
            const toXY = (i: number): [number, number] | null => {
              const lm = landmarks[i]
              if (!lm || (lm.visibility ?? 1) < MIN_POINT_VISIBILITY) return null
              const x = cw - (lm.x * vw * scale + offsetX) // vidéo à l'écran est en mirroir (selfie)
              const y = lm.y * vh * scale + offsetY
              return [x, y]
            }

            ctx.strokeStyle = 'rgba(163, 230, 53, 0.85)'
            ctx.lineWidth = 3
            for (const [a, b] of SKELETON_CONNECTIONS) {
              const pa = toXY(a)
              const pb = toXY(b)
              if (!pa || !pb) continue
              ctx.beginPath()
              ctx.moveTo(pa[0], pa[1])
              ctx.lineTo(pb[0], pb[1])
              ctx.stroke()
            }
            ctx.fillStyle = 'rgba(163, 230, 53, 0.95)'
            for (const i of SKELETON_POINTS) {
              const p = toXY(i)
              if (!p) continue
              ctx.beginPath()
              ctx.arc(p[0], p[1], 4, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelled = true
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [active, camera])

  if (!active || camera.permission !== 'granted') return null

  return (
    <div className="fixed inset-0 bg-black" style={{ zIndex: 0 }}>
      <video ref={camera.videoRef} muted playsInline className="w-full h-full object-cover -scale-x-100" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/70" />
    </div>
  )
}
