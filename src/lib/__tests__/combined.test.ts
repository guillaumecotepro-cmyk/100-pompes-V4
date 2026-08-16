import { describe, it, expect } from 'vitest'
import { computeCombinedStreak, computeCombinedWeekSummary, getLastActivity } from '../combined'
import { AppData, PompesFreeSession, WorkoutHistory } from '@/types'
import { DEFAULT_APP_DATA } from '../storage'
import { PlankSession } from '@/types/plank'

const NOW = new Date('2026-08-15T18:00:00')

function isoDaysAgo(days: number): string {
  const d = new Date('2026-08-15T12:00:00')
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function pompesEntry(date: string, completed = true): WorkoutHistory {
  return { id: Math.random().toString(36), date, sessionIndex: 0, week: 1, day: 1, sets: [], totalReps: 40, targetReps: 40, completed, duration: 60 }
}

function gainageEntry(date: string, status: PlankSession['status'] = 'completed'): PlankSession {
  return {
    id: Math.random().toString(36), mode: 'free', date, plannedDurationSeconds: 30, actualDurationSeconds: 30,
    totalHoldSeconds: 30, plannedSetCount: 1,
    sets: [{ order: 0, variant: 'forearm', targetSeconds: 30, actualSeconds: 30, status: 'completed' }],
    restSeconds: 30, status, difficultyFeedback: null, programId: null, programSessionIndex: null,
  }
}

function pompesFreeEntry(date: string, status: PompesFreeSession['status'] = 'completed'): PompesFreeSession {
  return {
    id: Math.random().toString(36), date, mode: 'stopwatch', plannedSetCount: 1, restSeconds: 60,
    sets: [{ order: 0, mode: 'stopwatch', targetSeconds: null, targetReps: null, actualReps: 15, actualDurationSeconds: 40, status: 'completed' }],
    totalReps: 15, actualDurationSeconds: 40, status,
  }
}

type CombinedTestData = Pick<AppData, 'history' | 'gainage' | 'pompesFreeHistory'>

function baseData(overrides: Partial<CombinedTestData>): CombinedTestData {
  return { history: [], gainage: DEFAULT_APP_DATA.gainage, pompesFreeHistory: [], ...overrides }
}

describe('computeCombinedStreak', () => {
  it('un jour compte une fois même si pompes ET gainage sont faits ce jour-là', () => {
    const today = isoDaysAgo(0)
    const data = baseData({
      history: [pompesEntry(today)],
      gainage: { ...DEFAULT_APP_DATA.gainage, sessions: [gainageEntry(today)] },
    })
    expect(computeCombinedStreak(data, NOW).currentStreak).toBe(1)
  })

  it('alterner pompes un jour et gainage le lendemain maintient la série combinée', () => {
    const data = baseData({
      history: [pompesEntry(isoDaysAgo(0)), pompesEntry(isoDaysAgo(2))],
      gainage: { ...DEFAULT_APP_DATA.gainage, sessions: [gainageEntry(isoDaysAgo(1))] },
    })
    expect(computeCombinedStreak(data, NOW).currentStreak).toBe(3)
  })

  it('ignore les séances non terminées', () => {
    const data = baseData({
      history: [pompesEntry(isoDaysAgo(0), false)],
      gainage: { ...DEFAULT_APP_DATA.gainage, sessions: [gainageEntry(isoDaysAgo(0), 'interrupted')] },
    })
    expect(computeCombinedStreak(data, NOW).currentStreak).toBe(0)
  })

  it('une séance libre pompes terminée compte pour la série', () => {
    const data = baseData({ pompesFreeHistory: [pompesFreeEntry(isoDaysAgo(0))] })
    expect(computeCombinedStreak(data, NOW).currentStreak).toBe(1)
  })

  it('ignore les séances libres pompes non terminées', () => {
    const data = baseData({ pompesFreeHistory: [pompesFreeEntry(isoDaysAgo(0), 'interrupted')] })
    expect(computeCombinedStreak(data, NOW).currentStreak).toBe(0)
  })
})

describe('computeCombinedWeekSummary', () => {
  it('compte les jours actifs uniques de la semaine civile en cours', () => {
    const data = baseData({
      history: [pompesEntry(isoDaysAgo(0)), pompesEntry(isoDaysAgo(1))],
      gainage: { ...DEFAULT_APP_DATA.gainage, sessions: [gainageEntry(isoDaysAgo(1)), gainageEntry(isoDaysAgo(30))] },
    })
    const summary = computeCombinedWeekSummary(data, NOW)
    expect(summary.pompesSessionsThisWeek).toBe(2)
    expect(summary.gainageSessionsThisWeek).toBe(1)
    expect(summary.activeDaysThisWeek).toBeLessThanOrEqual(2) // jour 1 partagé par les deux activités
  })
})

describe('getLastActivity', () => {
  it('retourne null si aucune activité', () => {
    expect(getLastActivity(baseData({}))).toBeNull()
  })

  it('retourne la plus récente des deux activités', () => {
    const data = baseData({
      history: [pompesEntry(isoDaysAgo(0))],
      gainage: { ...DEFAULT_APP_DATA.gainage, sessions: [gainageEntry(isoDaysAgo(3))] },
    })
    expect(getLastActivity(data)?.type).toBe('pompes')
  })
})
