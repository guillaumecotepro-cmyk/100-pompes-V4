import { describe, it, expect } from 'vitest'
import { getTickAudioEvent, getCountdownDigit } from '../audioSchedule'

describe('getTickAudioEvent', () => {
  it('décompte vocal pendant les 10 dernières secondes', () => {
    for (let remaining = 1; remaining <= 10; remaining++) {
      expect(getTickAudioEvent(50, remaining)).toBe('countdown')
    }
  })

  it('bip toutes les 10 secondes écoulées, en dehors du décompte final', () => {
    expect(getTickAudioEvent(10, 35)).toBe('beep')
    expect(getTickAudioEvent(20, 25)).toBe('beep')
  })

  it('aucun bip à l\'instant 0 (annonce "Gainage" gérée séparément)', () => {
    expect(getTickAudioEvent(0, 45)).toBe('silent')
  })

  it('silence en dehors des multiples de 10 et du décompte final', () => {
    expect(getTickAudioEvent(13, 32)).toBe('silent')
  })

  it('le décompte final est toujours prioritaire sur le bip, jamais de collision', () => {
    // remaining=10 correspond à un multiple de 10 écoulé sur une série de 40s (elapsed=30)
    expect(getTickAudioEvent(30, 10)).toBe('countdown')
  })

  it('une série ≤ 10 s démarre directement en décompte vocal, sans bip concurrent', () => {
    expect(getTickAudioEvent(0, 10)).toBe('countdown')
    expect(getTickAudioEvent(3, 7)).toBe('countdown')
  })

  it('silence quand la série est terminée (remaining <= 0)', () => {
    expect(getTickAudioEvent(45, 0)).toBe('silent')
    expect(getTickAudioEvent(46, -1)).toBe('silent')
  })
})

describe('getCountdownDigit', () => {
  it('retourne un entier borné entre 1 et 10', () => {
    expect(getCountdownDigit(10)).toBe(10)
    expect(getCountdownDigit(1)).toBe(1)
    expect(getCountdownDigit(0.4)).toBe(1)
    expect(getCountdownDigit(15)).toBe(10)
  })
})
