import { AppData, PompesFreeSession, WorkoutHistory } from '@/types'
import { PlankSession } from '@/types/plank'
import { computeStreakFromDays, localDayNumber, StreakResult } from './plank/stats'

type CombinedSource = Pick<AppData, 'history' | 'gainage' | 'pompesFreeHistory'>

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

/**
 * Série de jours actifs toutes activités confondues : un jour compte dès
 * qu'au moins une séance (Pompes OU Gainage) a été terminée ce jour-là.
 */
export function computeCombinedStreak(data: CombinedSource, now: Date = new Date()): StreakResult {
  const days = new Set<number>([
    ...pompesActiveDayNumbers(data.history, data.pompesFreeHistory),
    ...gainageActiveDayNumbers(data.gainage.sessions),
  ])
  return computeStreakFromDays(days, now)
}

export interface CombinedWeekSummary {
  activeDaysThisWeek: number
  pompesSessionsThisWeek: number
  gainageSessionsThisWeek: number
}

/** Résumé de la semaine civile en cours (dimanche -> aujourd'hui), toutes activités confondues. */
export function computeCombinedWeekSummary(data: CombinedSource, now: Date = new Date()): CombinedWeekSummary {
  const weekStart = startOfLocalWeekNumber(now)
  const pompesDays = pompesActiveDayNumbers(data.history, data.pompesFreeHistory).filter(d => d >= weekStart)
  const gainageDays = gainageActiveDayNumbers(data.gainage.sessions).filter(d => d >= weekStart)
  const activeDaysThisWeek = new Set([...pompesDays, ...gainageDays]).size

  return {
    activeDaysThisWeek,
    pompesSessionsThisWeek: pompesDays.length,
    gainageSessionsThisWeek: gainageDays.length,
  }
}

export interface LastActivity {
  type: 'pompes' | 'gainage'
  date: string
}

/** La toute dernière activité terminée (Pompes ou Gainage), pour l'affichage "Dernière séance". */
export function getLastActivity(data: CombinedSource): LastActivity | null {
  const lastProgramPompes = data.history.find(h => h.completed) ?? null
  const lastFreePompes = data.pompesFreeHistory.find(s => s.status === 'completed') ?? null
  const lastPompes = !lastProgramPompes ? lastFreePompes
    : !lastFreePompes ? lastProgramPompes
    : new Date(lastProgramPompes.date) >= new Date(lastFreePompes.date) ? lastProgramPompes : lastFreePompes
  const lastGainage = data.gainage.sessions.find(s => s.status === 'completed') ?? null

  if (!lastPompes && !lastGainage) return null
  if (!lastGainage) return { type: 'pompes', date: lastPompes!.date }
  if (!lastPompes) return { type: 'gainage', date: lastGainage.date }

  return new Date(lastPompes.date) >= new Date(lastGainage.date)
    ? { type: 'pompes', date: lastPompes.date }
    : { type: 'gainage', date: lastGainage.date }
}
