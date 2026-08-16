import { describe, it, expect } from 'vitest'
import { mapLandmarksToPoseFrame, diagnoseFraming, NormalizedLandmark } from '../mapLandmarks'

function landmark(x: number, y: number, visibility = 0.95): NormalizedLandmark {
  return { x, y, visibility }
}

/** Squelette debout, standard, bien cadré (indices BlazePose 0-32, seuls ceux utilisés sont réalistes). */
function standingLandmarks(overrides: Partial<Record<number, NormalizedLandmark>> = {}): NormalizedLandmark[] {
  const base: NormalizedLandmark[] = Array.from({ length: 33 }, () => landmark(0.5, 0.5))
  base[11] = landmark(0.45, 0.3)  // épaule gauche
  base[12] = landmark(0.55, 0.3)  // épaule droite
  base[23] = landmark(0.47, 0.55) // hanche gauche
  base[24] = landmark(0.53, 0.55) // hanche droite
  base[27] = landmark(0.47, 0.9)  // cheville gauche
  base[28] = landmark(0.53, 0.9)  // cheville droite
  base[15] = landmark(0.4, 0.5)   // poignet gauche
  base[16] = landmark(0.6, 0.5)   // poignet droit
  for (const [i, l] of Object.entries(overrides)) base[Number(i)] = l!
  return base
}

describe('mapLandmarksToPoseFrame', () => {
  it('aucun landmark -> corps non visible, confiance nulle', () => {
    const { frame, feetVisible } = mapLandmarksToPoseFrame(undefined, 1000, null)
    expect(frame.bodyVisible).toBe(false)
    expect(frame.confidence).toBe(0)
    expect(feetVisible).toBe(false)
  })

  it('squelette debout bien cadré -> corps visible, position verticale cohérente hanches/épaules', () => {
    const { frame, feetVisible } = mapLandmarksToPoseFrame(standingLandmarks(), 1000, null)
    expect(frame.bodyVisible).toBe(true)
    expect(feetVisible).toBe(true)
    expect(frame.verticalPosition).toBeCloseTo(0.55 * 0.7 + 0.3 * 0.3, 5)
    expect(frame.bodyScale).toBeCloseTo(0.6, 5) // chevilles(0.9) - épaules(0.3)
  })

  it('chevilles peu visibles -> feetVisible false même si le reste du corps est net', () => {
    const { feetVisible } = mapLandmarksToPoseFrame(
      standingLandmarks({ 27: landmark(0.47, 0.9, 0.1), 28: landmark(0.53, 0.9, 0.1) }),
      1000, null
    )
    expect(feetVisible).toBe(false)
  })

  it('déplacement latéral des hanches entre deux frames -> lateralVelocity > 0', () => {
    const first = mapLandmarksToPoseFrame(standingLandmarks(), 1000, null)
    const shifted = standingLandmarks({ 23: landmark(0.6, 0.55), 24: landmark(0.66, 0.55) })
    const second = mapLandmarksToPoseFrame(shifted, 1033, first.state)
    expect(second.frame.lateralVelocity).toBeGreaterThan(0)
  })

  it('poignets immobiles entre deux frames -> armMovement nul', () => {
    const first = mapLandmarksToPoseFrame(standingLandmarks(), 1000, null)
    const second = mapLandmarksToPoseFrame(standingLandmarks(), 1033, first.state)
    expect(second.frame.armMovement).toBe(0)
  })
})

describe('diagnoseFraming', () => {
  it('aucun corps détecté -> no_body', () => {
    expect(diagnoseFraming({ t: 0, verticalPosition: 0, bodyScale: 0.3, confidence: 0, bodyVisible: false, lateralVelocity: 0, armMovement: 0 }, false)).toBe('no_body')
  })

  it('corps trop proche (grande échelle) -> too_close', () => {
    expect(diagnoseFraming({ t: 0, verticalPosition: 0.5, bodyScale: 0.9, confidence: 0.9, bodyVisible: true, lateralVelocity: 0, armMovement: 0 }, true)).toBe('too_close')
  })

  it('corps trop loin (petite échelle) -> too_far', () => {
    expect(diagnoseFraming({ t: 0, verticalPosition: 0.5, bodyScale: 0.1, confidence: 0.9, bodyVisible: true, lateralVelocity: 0, armMovement: 0 }, true)).toBe('too_far')
  })

  it('pieds non visibles -> feet_not_visible', () => {
    expect(diagnoseFraming({ t: 0, verticalPosition: 0.5, bodyScale: 0.5, confidence: 0.9, bodyVisible: true, lateralVelocity: 0, armMovement: 0 }, false)).toBe('feet_not_visible')
  })

  it('confiance faible malgré un cadrage correct -> low_confidence', () => {
    expect(diagnoseFraming({ t: 0, verticalPosition: 0.5, bodyScale: 0.5, confidence: 0.3, bodyVisible: true, lateralVelocity: 0, armMovement: 0 }, true)).toBe('low_confidence')
  })

  it('tout est correct -> aucun problème', () => {
    expect(diagnoseFraming({ t: 0, verticalPosition: 0.5, bodyScale: 0.5, confidence: 0.9, bodyVisible: true, lateralVelocity: 0, armMovement: 0 }, true)).toBeNull()
  })
})
