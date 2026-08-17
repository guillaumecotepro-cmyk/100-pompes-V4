import { describe, it, expect } from 'vitest'
import { PoseJumpCounter, PoseFrame, simulatePoseSequence, DEFAULT_POSE_COUNTER_CONFIG } from '../poseCountingEngine'

const GROUND = 0.7
const BODY_SCALE = 0.3
const FPS = 30
const FRAME_MS = 1000 / FPS

function standingFrames(durationMs: number, startT = 0, overrides: Partial<PoseFrame> = {}): PoseFrame[] {
  const n = Math.floor(durationMs / FRAME_MS)
  return Array.from({ length: n }, (_, i) => ({
    t: startT + i * FRAME_MS,
    verticalPosition: GROUND,
    bodyScale: BODY_SCALE,
    confidence: 0.9,
    bodyVisible: true,
    lateralVelocity: 0,
    armMovement: 0,
    ...overrides,
  }))
}

/**
 * Génère une séquence de sauts périodiques (une "bosse" sinusoïdale par cycle = un saut).
 * Amplitude par défaut 0.08 : un saut à la corde ne décolle que de ~3-8cm du sol (contrairement
 * à un grand saut vertical) — voir DEFAULT_POSE_COUNTER_CONFIG pour le raisonnement complet.
 */
function jumpFrames(opts: {
  cadence: number // sauts / minute
  durationMs: number
  startT?: number
  amplitudeFactor?: number // fraction de bodyScale
  overrides?: Partial<PoseFrame>
}): PoseFrame[] {
  const startT = opts.startT ?? 0
  const amplitudeFactor = opts.amplitudeFactor ?? 0.08
  const cyclePeriodMs = 60_000 / opts.cadence
  const n = Math.floor(opts.durationMs / FRAME_MS)
  return Array.from({ length: n }, (_, i) => {
    const t = startT + i * FRAME_MS
    const phase = ((t - startT) % cyclePeriodMs) / cyclePeriodMs
    const verticalPosition = GROUND - BODY_SCALE * amplitudeFactor * Math.max(0, Math.sin(phase * Math.PI))
    return {
      t, verticalPosition, bodyScale: BODY_SCALE, confidence: 0.9, bodyVisible: true,
      lateralVelocity: 0, armMovement: 0, ...opts.overrides,
    }
  })
}

function countJumps(cadence: number, seconds: number): number {
  const frames = [...standingFrames(600), ...jumpFrames({ cadence, durationMs: seconds * 1000, startT: 600 })]
  return simulatePoseSequence(frames).jumpTimestamps.length
}

describe('PoseJumpCounter — séries normales', () => {
  it('compte une série à cadence moyenne (~110/min) avec une erreur ≤ 5%', () => {
    const expectedJumps = 100
    const seconds = (expectedJumps / 110) * 60
    const counted = countJumps(110, seconds)
    const errorPct = Math.abs(counted - expectedJumps) / expectedJumps
    expect(errorPct).toBeLessThanOrEqual(0.05)
  })

  it('cadence lente (~50/min)', () => {
    const counted = countJumps(50, 10)
    expect(counted).toBeGreaterThanOrEqual(7)
    expect(counted).toBeLessThanOrEqual(9)
  })

  it('cadence rapide (~200/min)', () => {
    const counted = countJumps(200, 10)
    const expected = Math.floor((200 / 60) * 10)
    expect(Math.abs(counted - expected)).toBeLessThanOrEqual(2)
  })

  it('aucun double comptage sur un cycle unique', () => {
    const frames = [...standingFrames(500), ...jumpFrames({ cadence: 100, durationMs: 600, startT: 500 })]
    const result = simulatePoseSequence(frames)
    expect(result.jumpTimestamps.length).toBeLessThanOrEqual(1)
  })
})

describe('PoseJumpCounter — rejets (pas de faux positifs)', () => {
  it('immobile : aucun saut compté', () => {
    const result = simulatePoseSequence(standingFrames(3000))
    expect(result.jumpTimestamps).toHaveLength(0)
  })

  it('marche sans saut (vitesse latérale élevée) : aucun saut compté', () => {
    const frames = [
      ...standingFrames(500),
      ...jumpFrames({ cadence: 100, durationMs: 3000, startT: 500, overrides: { lateralVelocity: 0.8 } }),
    ]
    const result = simulatePoseSequence(frames)
    expect(result.jumpTimestamps).toHaveLength(0)
  })

  it('flexions simples (amplitude insuffisante) : aucun saut compté', () => {
    const frames = [
      ...standingFrames(500),
      ...jumpFrames({ cadence: 80, durationMs: 3000, startT: 500, amplitudeFactor: 0.015 }), // sous airborneThresholdFactor (0.04)
    ]
    const result = simulatePoseSequence(frames)
    expect(result.jumpTimestamps).toHaveLength(0)
  })

  it('petit saut à la corde réaliste (amplitude ~5%, ≈4-5cm) : compté normalement', () => {
    // Un saut à la corde décolle typiquement de 3 à 8cm (contrairement à un grand saut vertical
    // de type test physique) — ce test protège contre une re-calibration trop stricte qui rendrait
    // le comptage caméra inutilisable en usage réel, comme observé avant ce correctif.
    const frames = [
      ...standingFrames(500),
      ...jumpFrames({ cadence: 100, durationMs: 3000, startT: 500, amplitudeFactor: 0.05 }),
    ]
    const result = simulatePoseSequence(frames)
    expect(result.jumpTimestamps.length).toBeGreaterThan(0)
  })

  it('mouvement de bras seul (corps immobile) : aucun saut compté', () => {
    const frames = [
      ...standingFrames(500),
      ...standingFrames(3000, 500, { armMovement: 0.9 }),
    ]
    const result = simulatePoseSequence(frames)
    expect(result.jumpTimestamps).toHaveLength(0)
  })
})

describe('PoseJumpCounter — perte et récupération du corps', () => {
  it('occultation momentanée (< délai de perte) : la détection continue normalement', () => {
    const before = jumpFrames({ cadence: 100, durationMs: 1200, startT: 600 })
    const occlusion = standingFrames(300, 1800, { confidence: 0.1, bodyVisible: false })
    const after = jumpFrames({ cadence: 100, durationMs: 1200, startT: 2100 })
    const frames = [...standingFrames(600), ...before, ...occlusion, ...after]
    const result = simulatePoseSequence(frames)
    expect(result.finalState).not.toBe('lost')
    expect(result.jumpTimestamps.length).toBeGreaterThan(0)
  })

  it('sortie complète du cadre (> délai de perte) : passe en état "lost" et arrête de compter', () => {
    const frames = [
      ...standingFrames(600),
      ...jumpFrames({ cadence: 100, durationMs: 600, startT: 600 }),
      ...standingFrames(2000, 1200, { confidence: 0, bodyVisible: false }),
    ]
    const result = simulatePoseSequence(frames)
    expect(result.finalState).toBe('lost')
  })
})

describe('PoseJumpCounter — pause et reprise', () => {
  it('aucun saut compté pendant la pause, reprend correctement après', () => {
    const counter = new PoseJumpCounter()
    for (const f of standingFrames(600)) counter.pushFrame(f)
    for (const f of jumpFrames({ cadence: 100, durationMs: 600, startT: 600 })) counter.pushFrame(f)
    const beforePause = counter.jumpCount
    counter.pause()
    for (const f of jumpFrames({ cadence: 100, durationMs: 2000, startT: 1200 })) counter.pushFrame(f)
    expect(counter.jumpCount).toBe(beforePause) // rien compté pendant la pause
    counter.resume()
    for (const f of jumpFrames({ cadence: 100, durationMs: 2000, startT: 3500 })) counter.pushFrame(f)
    expect(counter.jumpCount).toBeGreaterThan(beforePause)
  })
})

describe('PoseJumpCounter — confiance insuffisante', () => {
  it('ne compte pas si la confiance reste sous le seuil', () => {
    const frames = jumpFrames({ cadence: 100, durationMs: 3000, overrides: { confidence: 0.2 } })
    const result = simulatePoseSequence(frames)
    expect(result.jumpTimestamps).toHaveLength(0)
  })
})

describe('DEFAULT_POSE_COUNTER_CONFIG', () => {
  it('respecte la plage de cadence physiologiquement plausible (intervalle minimal cohérent)', () => {
    const maxCadenceFromInterval = 60_000 / DEFAULT_POSE_COUNTER_CONFIG.minJumpIntervalMs
    expect(maxCadenceFromInterval).toBeLessThanOrEqual(300)
    expect(maxCadenceFromInterval).toBeGreaterThan(100)
  })
})
