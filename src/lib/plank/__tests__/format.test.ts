import { describe, it, expect } from 'vitest'
import { formatDurationHMS } from '../format'

describe('formatDurationHMS', () => {
  it('secondes seules sous la minute', () => {
    expect(formatDurationHMS(0)).toBe('0 s')
    expect(formatDurationHMS(45)).toBe('45 s')
  })

  it('minutes + secondes sous l\'heure', () => {
    expect(formatDurationHMS(60)).toBe('1 min')
    expect(formatDurationHMS(90)).toBe('1 min 30 s')
    expect(formatDurationHMS(3599)).toBe('59 min 59 s')
  })

  it('heures + minutes au-delà de l\'heure, sans les secondes', () => {
    expect(formatDurationHMS(3600)).toBe('1 h')
    expect(formatDurationHMS(3660)).toBe('1 h 1 min')
    expect(formatDurationHMS(7325)).toBe('2 h 2 min')
  })

  it('ne descend jamais sous 0', () => {
    expect(formatDurationHMS(-10)).toBe('0 s')
  })
})
