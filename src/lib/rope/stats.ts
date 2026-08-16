import { JumpSession } from '@/types/rope'
import { computeStreakFromDays, localDayNumber, StreakResult } from '../plank/stats'

/**
 * Cadence moyenne et maximale à partir des timestamps de sauts (ms).
 * La cadence max utilise une fenêtre glissante de 3 s (plus représentative
 * qu'un simple intervalle instantané entre deux sauts).
 */
export function computeCadenceFromTimestamps(jumpTimestamps: number[], windowMs = 3_000): { avgCadence: number; maxCadence: number } {
  if (jumpTimestamps.length < 2) return { avgCadence: 0, maxCadence: 0 }
  const sorted = [...jumpTimestamps].sort((a, b) => a - b)
  const totalMinutes = (sorted[sorted.length - 1] - sorted[0]) / 60_000
  const avgCadence = totalMinutes > 0 ? Math.round(sorted.length / totalMinutes) : 0

  let maxInWindow = 0
  let left = 0
  for (let right = 0; right < sorted.length; right++) {
    while (sorted[right] - sorted[left] > windowMs) left++
    maxInWindow = Math.max(maxInWindow, right - left + 1)
  }
  const maxCadence = Math.round((maxInWindow / windowMs) * 60_000)
  return { avgCadence, maxCadence }
}

export interface JumpTotals {
  totalSessions: number
  totalJumps: number
  totalActiveDurationSeconds: number
  averageJumpsPerSession: number
}

export function computeJumpTotals(sessions: JumpSession[]): JumpTotals {
  const completed = sessions.filter(s => s.status === 'completed')
  const totalJumps = completed.reduce((sum, s) => sum + s.totalJumps, 0)
  const totalActiveDurationSeconds = completed.reduce((sum, s) => sum + s.activeDurationSeconds, 0)
  return {
    totalSessions: completed.length,
    totalJumps,
    totalActiveDurationSeconds,
    averageJumpsPerSession: completed.length > 0 ? Math.round(totalJumps / completed.length) : 0,
  }
}

export function computeJumpStreak(sessions: JumpSession[], now: Date = new Date()): StreakResult {
  const days = new Set(sessions.filter(s => s.status === 'completed').map(s => localDayNumber(s.date)))
  return computeStreakFromDays(days, now)
}

/** Meilleur nombre de sauts en une seule séance (toutes séances confondues). */
export function computeBestSessionJumps(sessions: JumpSession[]): number {
  return sessions.filter(s => s.status === 'completed').reduce((max, s) => Math.max(max, s.totalJumps), 0)
}

/** Meilleure cadence moyenne validée (durée active minimale exigée pour éviter qu'un pic très court ne compte). */
export function computeBestValidatedCadence(sessions: JumpSession[], minActiveDurationSeconds = 20): number {
  return sessions
    .filter(s => s.status === 'completed' && s.activeDurationSeconds >= minActiveDurationSeconds)
    .reduce((max, s) => Math.max(max, s.avgCadence), 0)
}

/** Plus longue durée active cumulée en une seule séance. */
export function computeBestActiveDuration(sessions: JumpSession[]): number {
  return sessions.filter(s => s.status === 'completed').reduce((max, s) => Math.max(max, s.activeDurationSeconds), 0)
}

function startOfLocalWeekNumber(now: Date): number {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000)
}

export function computeSessionsThisWeek(sessions: JumpSession[], now: Date = new Date()): number {
  const weekStart = startOfLocalWeekNumber(now)
  return sessions.filter(s => s.status === 'completed' && localDayNumber(s.date) >= weekStart).length
}

export interface JumpRecordPoint {
  date: string
  jumps: number
}

/** Série temporelle du record (maximum courant de sauts en une séance) pour un graphique de progression. */
export function buildJumpRecordProgression(sessions: JumpSession[]): JumpRecordPoint[] {
  const points = sessions
    .filter(s => s.status === 'completed')
    .map(s => ({ date: s.date, jumps: s.totalJumps }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  let runningMax = 0
  return points.map(p => {
    runningMax = Math.max(runningMax, p.jumps)
    return { date: p.date, jumps: runningMax }
  })
}

export interface DailyChallengeProgress {
  today: number
  week: number
  month: number
  year: number
}

/** Progression du défi quotidien (sauts) — aujourd'hui / semaine / mois / année, recalculée depuis l'historique. */
export function computeDailyChallengeProgress(sessions: JumpSession[], now: Date = new Date()): DailyChallengeProgress {
  const completed = sessions.filter(s => s.status === 'completed')
  const todayNumber = localDayNumber(now.toISOString())
  const weekStart = startOfLocalWeekNumber(now)
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`
  const year = now.getFullYear()

  let today = 0, week = 0, month = 0, yearTotal = 0
  for (const s of completed) {
    const day = localDayNumber(s.date)
    const d = new Date(s.date)
    if (day === todayNumber) today += s.totalJumps
    if (day >= weekStart) week += s.totalJumps
    if (`${d.getFullYear()}-${d.getMonth()}` === monthKey) month += s.totalJumps
    if (d.getFullYear() === year) yearTotal += s.totalJumps
  }
  return { today, week, month, year: yearTotal }
}
