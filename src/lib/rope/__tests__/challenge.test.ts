import { describe, it, expect } from 'vitest'
import { getChallenge7State, getNextChallenge7Day, isChallenge7Complete, isDailyChallengeMetToday } from '../challenge'
import { DailyChallengeSettings, JumpSession } from '@/types/rope'

function session(overrides: Partial<JumpSession> = {}): JumpSession {
  return {
    id: Math.random().toString(36), mode: 'free', date: '2026-08-15T10:00:00.000Z', endDate: '2026-08-15T10:05:00.000Z',
    timezone: 'Europe/Paris', totalDurationSeconds: 300, activeDurationSeconds: 250, totalJumps: 300,
    avgCadence: 100, maxCadence: 130, caloriesEstimated: 50, heartRateAvg: null, countingMethod: 'manual',
    countingAlgorithmVersion: 1, series: [], bestStreak: 300, manualCorrection: false, notes: null, journal: null,
    programId: null, programWorkoutIndex: null, challengeId: null, challengeDay: null, status: 'completed',
    clipId: null, virtual: false, ...overrides,
  }
}

describe('défi 7 jours — recalculé depuis l\'historique', () => {
  it('aucune séance -> jour 1 est le prochain, rien de complété', () => {
    const state = getChallenge7State([])
    expect(state[0]).toEqual({ day: 1, targetJumps: 250, achievedJumps: 0, completed: false })
    expect(getNextChallenge7Day([])).toBe(1)
    expect(isChallenge7Complete([])).toBe(false)
  })

  it('une séance partielle sur le jour 1 ne le valide pas, mais une seconde séance le même jour la complète (reprise)', () => {
    const sessions = [
      session({ challengeId: 'challenge7', challengeDay: 1, totalJumps: 150 }),
      session({ challengeId: 'challenge7', challengeDay: 1, totalJumps: 120 }),
    ]
    const state = getChallenge7State(sessions)
    expect(state[0].achievedJumps).toBe(270)
    expect(state[0].completed).toBe(true)
    expect(getNextChallenge7Day(sessions)).toBe(2)
  })

  it('les séances non terminées ne comptent jamais', () => {
    const sessions = [session({ challengeId: 'challenge7', challengeDay: 1, totalJumps: 999, status: 'interrupted' })]
    expect(getChallenge7State(sessions)[0].completed).toBe(false)
  })

  it('tous les jours complétés -> défi entièrement réussi', () => {
    const sessions = [1, 2, 3, 4, 5, 6, 7].map(day =>
      session({ challengeId: 'challenge7', challengeDay: day, totalJumps: 500 })
    )
    expect(isChallenge7Complete(sessions)).toBe(true)
    expect(getNextChallenge7Day(sessions)).toBeNull()
  })
})

describe('défi quotidien', () => {
  const settings: DailyChallengeSettings = { enabled: true, targetJumps: 200, targetDurationSeconds: null }

  it('désactivé -> jamais atteint', () => {
    expect(isDailyChallengeMetToday({ ...settings, enabled: false }, [], new Date())).toBe(false)
  })

  it('aucun objectif configuré -> jamais atteint (rien à mesurer)', () => {
    const noTargets: DailyChallengeSettings = { enabled: true, targetJumps: null, targetDurationSeconds: null }
    const sessions = [session({ date: new Date().toISOString(), totalJumps: 999 })]
    expect(isDailyChallengeMetToday(noTargets, sessions, new Date())).toBe(false)
  })

  it('objectif de sauts atteint aujourd\'hui', () => {
    const now = new Date()
    const sessions = [session({ date: now.toISOString(), totalJumps: 250 })]
    expect(isDailyChallengeMetToday(settings, sessions, now)).toBe(true)
  })

  it('objectif non atteint -> false', () => {
    const now = new Date()
    const sessions = [session({ date: now.toISOString(), totalJumps: 50 })]
    expect(isDailyChallengeMetToday(settings, sessions, now)).toBe(false)
  })

  it('les deux objectifs (sauts ET durée) doivent être atteints quand les deux sont configurés', () => {
    const both: DailyChallengeSettings = { enabled: true, targetJumps: 200, targetDurationSeconds: 600 }
    const now = new Date()
    const sessions = [session({ date: now.toISOString(), totalJumps: 250, activeDurationSeconds: 100 })]
    expect(isDailyChallengeMetToday(both, sessions, now)).toBe(false)
  })
})
