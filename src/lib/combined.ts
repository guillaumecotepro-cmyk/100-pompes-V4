import { AppData, PompesFreeSession, WorkoutHistory } from '@/types'
import { PlankSession } from '@/types/plank'
import { JumpSession } from '@/types/rope'
import { computeStreakFromDays, localDayNumber, StreakResult } from './plank/stats'

type CombinedSource = Pick<AppData, 'history' | 'gainage' | 'pompesFreeHistory' | 'jumprope'>

function startOfLocalWeekNumber(now: Date): number {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000)
}

function pompesActiveDayNumbers(history: WorkoutHistory[], freeHistory: PompesFreeSession[]): number[] {
  return [
    ...history.filter(h => h.completed).map(h => localDayNumber(h.date)),
    ...freeHistory.filter(s => s.status === 'completed').map(s => localDayNumber(s.date)),
  ]
}

function gainageActiveDayNumbers(sessions: PlankSession[]): number[] {
  return sessions.filter(s => s.status === 'completed').map(s => localDayNumber(s.date))
}

function jumpropeActiveDayNumbers(sessions: JumpSession[]): number[] {
  return sessions.filter(s => s.status === 'completed').map(s => localDayNumber(s.date))
}

/**
 * Série de jours actifs toutes activités confondues : un jour compte dès
 * qu'au moins une séance (Pompes, Gainage OU Corde à sauter) a été
 * terminée ce jour-là.
 */
export function computeCombinedStreak(data: CombinedSource, now: Date = new Date()): StreakResult {
  const days = new Set<number>([
    ...pompesActiveDayNumbers(data.history, data.pompesFreeHistory),
    ...gainageActiveDayNumbers(data.gainage.sessions),
    ...jumpropeActiveDayNumbers(data.jumprope.sessions),
  ])
  return computeStreakFromDays(days, now)
}

export interface CombinedWeekSummary {
  activeDaysThisWeek: number
  pompesSessionsThisWeek: number
  gainageSessionsThisWeek: number
  jumpropeSessionsThisWeek: number
}

/** Résumé de la semaine civile en cours (dimanche -> aujourd'hui), toutes activités confondues. */
export function computeCombinedWeekSummary(data: CombinedSource, now: Date = new Date()): CombinedWeekSummary {
  const weekStart = startOfLocalWeekNumber(now)
  const pompesDays = pompesActiveDayNumbers(data.history, data.pompesFreeHistory).filter(d => d >= weekStart)
  const gainageDays = gainageActiveDayNumbers(data.gainage.sessions).filter(d => d >= weekStart)
  const jumpropeDays = jumpropeActiveDayNumbers(data.jumprope.sessions).filter(d => d >= weekStart)
  const activeDaysThisWeek = new Set([...pompesDays, ...gainageDays, ...jumpropeDays]).size

  return {
    activeDaysThisWeek,
    pompesSessionsThisWeek: pompesDays.length,
    gainageSessionsThisWeek: gainageDays.length,
    jumpropeSessionsThisWeek: jumpropeDays.length,
  }
}

export interface LastActivity {
  type: 'pompes' | 'gainage' | 'jumprope'
  date: string
}

/** La toute dernière activité terminée (les trois confondues), pour l'affichage "Dernière séance". */
export function getLastActivity(data: CombinedSource): LastActivity | null {
  const lastProgramPompes = data.history.find(h => h.completed) ?? null
  const lastFreePompes = data.pompesFreeHistory.find(s => s.status === 'completed') ?? null
  const lastPompes = !lastProgramPompes ? lastFreePompes
    : !lastFreePompes ? lastProgramPompes
    : new Date(lastProgramPompes.date) >= new Date(lastFreePompes.date) ? lastProgramPompes : lastFreePompes
  const lastGainage = data.gainage.sessions.find(s => s.status === 'completed') ?? null
  const lastJumprope = data.jumprope.sessions.find(s => s.status === 'completed') ?? null

  const candidates: LastActivity[] = [
    ...(lastPompes ? [{ type: 'pompes' as const, date: lastPompes.date }] : []),
    ...(lastGainage ? [{ type: 'gainage' as const, date: lastGainage.date }] : []),
    ...(lastJumprope ? [{ type: 'jumprope' as const, date: lastJumprope.date }] : []),
  ]
  if (candidates.length === 0) return null

  return candidates.reduce((latest, c) => (new Date(c.date) > new Date(latest.date) ? c : latest))
}

export interface GlobalTotals {
  totalSessions: number
  totalActiveDurationSeconds: number
}

/** Totaux toutes activités confondues (nombre de séances, durée active cumulée). */
export function computeGlobalTotals(data: CombinedSource): GlobalTotals {
  const pompesCount = data.history.filter(h => h.completed).length + data.pompesFreeHistory.filter(s => s.status === 'completed').length
  const gainageSessions = data.gainage.sessions.filter(s => s.status === 'completed')
  const jumpropeSessions = data.jumprope.sessions.filter(s => s.status === 'completed')

  const pompesDuration = data.history.filter(h => h.completed).reduce((s, h) => s + h.duration, 0)
    + data.pompesFreeHistory.filter(s => s.status === 'completed').reduce((s, x) => s + x.actualDurationSeconds, 0)
  const gainageDuration = gainageSessions.reduce((s, x) => s + x.actualDurationSeconds, 0)
  const jumpropeDuration = jumpropeSessions.reduce((s, x) => s + x.activeDurationSeconds, 0)

  return {
    totalSessions: pompesCount + gainageSessions.length + jumpropeSessions.length,
    totalActiveDurationSeconds: pompesDuration + gainageDuration + jumpropeDuration,
  }
}
