import { describe, it, expect } from 'vitest'
import {
  computeCadenceFromTimestamps, computeJumpTotals, computeBestSessionJumps,
  computeBestValidatedCadence, computeBestActiveDuration, computeDailyChallengeProgress,
  computeSessionsThisWeek, buildJumpRecordProgression,
} from '../stats'
import { JumpSession } from '@/types/rope'

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

describe('computeCadenceFromTimestamps', () => {
  it('un saut toutes les 500ms -> cadence moyenne proche de 120/min', () => {
    // 20 sauts espacés de 500ms couvrent 19 intervalles (9.5s) -> ~126/min (comptage réel entre 1er et dernier saut)
    const timestamps = Array.from({ length: 20 }, (_, i) => i * 500)
    const { avgCadence } = computeCadenceFromTimestamps(timestamps)
    expect(avgCadence).toBeGreaterThanOrEqual(118)
    expect(avgCadence).toBeLessThanOrEqual(126)
  })

  it('moins de deux sauts -> zéro (jamais de valeur inventée)', () => {
    expect(computeCadenceFromTimestamps([]).avgCadence).toBe(0)
    expect(computeCadenceFromTimestamps([100]).avgCadence).toBe(0)
  })

  it('cadence max capte une accélération ponctuelle au-dessus de la moyenne', () => {
    // 5 sauts lents (1/s) puis une rafale rapide (5 sauts en 1s)
    const slow = Array.from({ length: 5 }, (_, i) => i * 1000)
    const burst = Array.from({ length: 5 }, (_, i) => 5000 + i * 200)
    const { avgCadence, maxCadence } = computeCadenceFromTimestamps([...slow, ...burst])
    expect(maxCadence).toBeGreaterThan(avgCadence)
  })
})

describe('computeJumpTotals', () => {
  it('ignore les séances non terminées', () => {
    const totals = computeJumpTotals([session({ totalJumps: 100 }), session({ totalJumps: 999, status: 'interrupted' })])
    expect(totals.totalSessions).toBe(1)
    expect(totals.totalJumps).toBe(100)
  })

  it('zéro séance -> tous les totaux à zéro', () => {
    const totals = computeJumpTotals([])
    expect(totals.totalSessions).toBe(0)
    expect(totals.totalJumps).toBe(0)
    expect(totals.averageJumpsPerSession).toBe(0)
  })
})

describe('computeBestSessionJumps / computeBestActiveDuration', () => {
  it('retourne le maximum parmi les séances terminées', () => {
    const sessions = [session({ totalJumps: 200, activeDurationSeconds: 120 }), session({ totalJumps: 500, activeDurationSeconds: 90 })]
    expect(computeBestSessionJumps(sessions)).toBe(500)
    expect(computeBestActiveDuration(sessions)).toBe(120)
  })
})

describe('computeBestValidatedCadence', () => {
  it('exige une durée active minimale pour éviter qu\'un pic très court ne compte', () => {
    const sessions = [
      session({ avgCadence: 250, activeDurationSeconds: 3 }), // pic trop court, exclu
      session({ avgCadence: 150, activeDurationSeconds: 60 }),
    ]
    expect(computeBestValidatedCadence(sessions)).toBe(150)
  })
})

describe('computeDailyChallengeProgress', () => {
  it('agrège correctement aujourd\'hui/semaine/mois/année', () => {
    const now = new Date('2026-08-15T18:00:00')
    const sessions = [
      session({ date: '2026-08-15T09:00:00.000Z', totalJumps: 300 }), // aujourd'hui
      session({ date: '2026-08-10T09:00:00.000Z', totalJumps: 200 }), // ce mois, semaine précédente
      session({ date: '2026-01-05T09:00:00.000Z', totalJumps: 100 }), // cette année seulement
    ]
    const progress = computeDailyChallengeProgress(sessions, now)
    expect(progress.today).toBe(300)
    expect(progress.month).toBeGreaterThanOrEqual(300)
    expect(progress.year).toBe(600)
  })

  it('aucune séance -> tout à zéro', () => {
    const progress = computeDailyChallengeProgress([], new Date())
    expect(progress).toEqual({ today: 0, week: 0, month: 0, year: 0 })
  })
})

describe('computeSessionsThisWeek', () => {
  it('ignore les séances non terminées et celles avant le début de semaine', () => {
    const now = new Date('2026-08-15T12:00:00') // samedi
    const sessions = [
      session({ date: '2026-08-14T09:00:00.000Z' }), // cette semaine
      session({ date: '2026-08-01T09:00:00.000Z' }), // semaine précédente
      session({ date: '2026-08-14T09:00:00.000Z', status: 'interrupted' }),
    ]
    expect(computeSessionsThisWeek(sessions, now)).toBe(1)
  })
})

describe('buildJumpRecordProgression', () => {
  it('produit un maximum courant croissant, jamais décroissant', () => {
    const sessions = [
      session({ date: '2026-08-01T09:00:00.000Z', totalJumps: 200 }),
      session({ date: '2026-08-05T09:00:00.000Z', totalJumps: 150 }), // en dessous du record -> record inchangé
      session({ date: '2026-08-10T09:00:00.000Z', totalJumps: 400 }),
    ]
    const progression = buildJumpRecordProgression(sessions)
    expect(progression.map(p => p.jumps)).toEqual([200, 200, 400])
  })

  it('aucune séance -> tableau vide, jamais de valeur inventée', () => {
    expect(buildJumpRecordProgression([])).toEqual([])
  })
})
