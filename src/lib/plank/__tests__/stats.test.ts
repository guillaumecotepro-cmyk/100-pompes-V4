import { describe, it, expect } from 'vitest'
import {
  computePlankStreak,
  computePlankTotals,
  computeBestContinuousHold,
  computeSessionsThisWeek,
  localDayKey,
  buildRecordProgression,
} from '../stats'
import { PlankSession, PlankTest } from '@/types/plank'

function session(overrides: Partial<PlankSession>): PlankSession {
  return {
    id: Math.random().toString(36),
    mode: 'free',
    date: new Date().toISOString(),
    plannedDurationSeconds: 60,
    actualDurationSeconds: 60,
    totalHoldSeconds: 60,
    plannedSetCount: 1,
    sets: [{ order: 0, variant: 'forearm', targetSeconds: 60, actualSeconds: 60, status: 'completed' }],
    restSeconds: 30,
    status: 'completed',
    difficultyFeedback: null,
    programId: null,
    programSessionIndex: null,
    ...overrides,
  }
}

function isoDaysAgo(days: number): string {
  const d = new Date('2026-08-15T12:00:00')
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

const NOW = new Date('2026-08-15T18:00:00')

describe('computePlankStreak', () => {
  it('0 séance → streak 0/0', () => {
    expect(computePlankStreak([], NOW)).toEqual({ currentStreak: 0, bestStreak: 0 })
  })

  it('une séance terminée aujourd\'hui → streak courante 1', () => {
    const sessions = [session({ date: isoDaysAgo(0) })]
    expect(computePlankStreak(sessions, NOW).currentStreak).toBe(1)
  })

  it('3 jours consécutifs jusqu\'à hier → streak encore active (aujourd\'hui pas encore fait)', () => {
    const sessions = [isoDaysAgo(1), isoDaysAgo(2), isoDaysAgo(3)].map(date => session({ date }))
    expect(computePlankStreak(sessions, NOW).currentStreak).toBe(3)
  })

  it('trou d\'un jour → streak courante retombe à 0, meilleure streak conservée', () => {
    const sessions = [isoDaysAgo(0), isoDaysAgo(3), isoDaysAgo(4)].map(date => session({ date }))
    const result = computePlankStreak(sessions, NOW)
    expect(result.currentStreak).toBe(1)
    expect(result.bestStreak).toBe(2)
  })

  it('plusieurs séances le même jour ne comptent qu\'une fois', () => {
    const today = isoDaysAgo(0)
    const sessions = [session({ date: today }), session({ date: today }), session({ date: today })]
    expect(computePlankStreak(sessions, NOW).currentStreak).toBe(1)
  })

  it('les séances interrompues ou annulées ne comptent pas dans la série', () => {
    const sessions = [session({ date: isoDaysAgo(0), status: 'interrupted' })]
    expect(computePlankStreak(sessions, NOW).currentStreak).toBe(0)
  })
})

describe('computePlankTotals', () => {
  it('ignore les séances non terminées', () => {
    const sessions = [
      session({ totalHoldSeconds: 60, status: 'completed' }),
      session({ totalHoldSeconds: 999, status: 'interrupted' }),
    ]
    const totals = computePlankTotals(sessions)
    expect(totals.totalSessions).toBe(1)
    expect(totals.totalHoldSeconds).toBe(60)
    expect(totals.averageDurationSeconds).toBe(60)
  })
})

describe('computeBestContinuousHold', () => {
  it('se base sur une série individuelle, pas sur la somme', () => {
    const sessions = [session({
      sets: [
        { order: 0, variant: 'forearm', targetSeconds: 40, actualSeconds: 40, status: 'completed' },
        { order: 1, variant: 'forearm', targetSeconds: 40, actualSeconds: 35, status: 'completed' },
      ],
      totalHoldSeconds: 75,
    })]
    expect(computeBestContinuousHold(sessions, [])).toBe(40)
  })

  it('prend en compte les tests initiaux', () => {
    const tests: PlankTest[] = [{ id: '1', date: isoDaysAgo(0), durationSeconds: 90 }]
    expect(computeBestContinuousHold([], tests)).toBe(90)
  })

  it('ignore les séries non terminées', () => {
    const sessions = [session({
      sets: [{ order: 0, variant: 'forearm', targetSeconds: 40, actualSeconds: 200, status: 'interrupted' }],
    })]
    expect(computeBestContinuousHold(sessions, [])).toBe(0)
  })
})

describe('computeSessionsThisWeek', () => {
  it('compte uniquement les séances terminées de la semaine civile en cours', () => {
    const sessions = [
      session({ date: isoDaysAgo(0), status: 'completed' }),
      session({ date: isoDaysAgo(1), status: 'completed' }),
      session({ date: isoDaysAgo(30), status: 'completed' }),
    ]
    expect(computeSessionsThisWeek(sessions, NOW)).toBeGreaterThanOrEqual(1)
    expect(computeSessionsThisWeek(sessions, NOW)).toBeLessThanOrEqual(2)
  })
})

describe('localDayKey', () => {
  it('produit une clé stable YYYY-MM-DD', () => {
    expect(localDayKey('2026-08-15T23:59:00')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('buildRecordProgression', () => {
  it('produit un maximum courant croissant', () => {
    const sessions = [
      session({ date: isoDaysAgo(2), sets: [{ order: 0, variant: 'forearm', targetSeconds: 30, actualSeconds: 30, status: 'completed' }] }),
      session({ date: isoDaysAgo(1), sets: [{ order: 0, variant: 'forearm', targetSeconds: 20, actualSeconds: 20, status: 'completed' }] }),
      session({ date: isoDaysAgo(0), sets: [{ order: 0, variant: 'forearm', targetSeconds: 50, actualSeconds: 50, status: 'completed' }] }),
    ]
    const progression = buildRecordProgression(sessions, [])
    const seconds = progression.map(p => p.seconds)
    expect(seconds).toEqual([30, 30, 50])
  })
})
