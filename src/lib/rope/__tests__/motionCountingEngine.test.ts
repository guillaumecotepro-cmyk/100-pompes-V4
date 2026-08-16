import { describe, it, expect } from 'vitest'
import { MotionJumpCounter, MotionSample, simulateMotionSequence } from '../motionCountingEngine'

const BASELINE = 9.8
const FPS = 50
const FRAME_MS = 1000 / FPS

function restingSamples(durationMs: number, startT = 0, overrides: Partial<MotionSample> = {}): MotionSample[] {
  const n = Math.floor(durationMs / FRAME_MS)
  return Array.from({ length: n }, (_, i) => ({ t: startT + i * FRAME_MS, magnitude: BASELINE, ...overrides }))
}

function jumpSamples(opts: { cadence: number; durationMs: number; startT?: number; amplitude?: number }): MotionSample[] {
  const startT = opts.startT ?? 0
  const amplitude = opts.amplitude ?? 5
  const cyclePeriodMs = 60_000 / opts.cadence
  const n = Math.floor(opts.durationMs / FRAME_MS)
  return Array.from({ length: n }, (_, i) => {
    const t = startT + i * FRAME_MS
    const phase = ((t - startT) % cyclePeriodMs) / cyclePeriodMs
    const magnitude = BASELINE + amplitude * Math.max(0, Math.sin(phase * Math.PI))
    return { t, magnitude }
  })
}

function countJumps(cadence: number, seconds: number): number {
  const frames = [...restingSamples(500), ...jumpSamples({ cadence, durationMs: seconds * 1000, startT: 500 })]
  return simulateMotionSequence(frames).jumpTimestamps.length
}

describe('MotionJumpCounter — séries normales', () => {
  it('compte une série à cadence moyenne (~150/min) avec une erreur ≤ 5%', () => {
    const expected = 60
    const seconds = (expected / 150) * 60
    const counted = countJumps(150, seconds)
    expect(Math.abs(counted - expected) / expected).toBeLessThanOrEqual(0.05)
  })

  it('cadence lente (~60/min)', () => {
    const counted = countJumps(60, 10)
    expect(counted).toBeGreaterThanOrEqual(8)
    expect(counted).toBeLessThanOrEqual(11)
  })

  it('cadence rapide (~220/min)', () => {
    const counted = countJumps(220, 10)
    const expected = Math.floor((220 / 60) * 10)
    expect(Math.abs(counted - expected)).toBeLessThanOrEqual(3)
  })
})

describe('MotionJumpCounter — rejets', () => {
  it('téléphone immobile (posé) : aucun saut compté', () => {
    const result = simulateMotionSequence(restingSamples(3000))
    expect(result.jumpTimestamps).toHaveLength(0)
  })

  it('petites vibrations sous le seuil : aucun saut compté', () => {
    const frames = [
      ...restingSamples(500),
      ...jumpSamples({ cadence: 100, durationMs: 3000, startT: 500, amplitude: 0.5 }),
    ]
    const result = simulateMotionSequence(frames)
    expect(result.jumpTimestamps).toHaveLength(0)
  })
})

describe('MotionJumpCounter — pause et reprise', () => {
  it('aucun saut compté pendant la pause', () => {
    const counter = new MotionJumpCounter()
    for (const s of restingSamples(500)) counter.pushSample(s)
    for (const s of jumpSamples({ cadence: 120, durationMs: 1000, startT: 500 })) counter.pushSample(s)
    const before = counter.jumpCount
    counter.pause()
    for (const s of jumpSamples({ cadence: 120, durationMs: 2000, startT: 1500 })) counter.pushSample(s)
    expect(counter.jumpCount).toBe(before)
    counter.resume()
    for (const s of jumpSamples({ cadence: 120, durationMs: 2000, startT: 3500 })) counter.pushSample(s)
    expect(counter.jumpCount).toBeGreaterThan(before)
  })
})

describe('MotionJumpCounter — calibration', () => {
  it('n\'est pas calibré avant le nombre d\'échantillons requis', () => {
    const counter = new MotionJumpCounter()
    for (const s of restingSamples(100)) counter.pushSample(s)
    expect(counter.calibrated).toBe(false)
  })

  it('est calibré après le nombre d\'échantillons requis', () => {
    const counter = new MotionJumpCounter()
    for (const s of restingSamples(1000)) counter.pushSample(s)
    expect(counter.calibrated).toBe(true)
  })
})
