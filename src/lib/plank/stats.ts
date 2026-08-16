import { PlankSession, PlankTest } from '@/types/plank'

/** Clé calendaire locale "YYYY-MM-DD", insensible à l'heure de la journée. */
export function localDayKey(dateIso: string): string {
  const d = new Date(dateIso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Numéro de jour absolu, calculé via Date.UTC sur les composantes locales
 * (année/mois/jour) : la différence entre deux jours reste exactement 1
 * même lors d'un changement d'heure d'été ou de fuseau, contrairement à une
 * simple soustraction de timestamps.
 */
export function localDayNumber(dateIso: string): number {
  const d = new Date(dateIso)
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000)
}

export interface StreakResult {
  currentStreak: number
  bestStreak: number
}

/**
 * Calcule la série courante/meilleure à partir d'un ensemble de numéros de
 * jour (voir localDayNumber). Générique — réutilisé pour Gainage seul et
 * pour la série combinée Pompes + Gainage.
 */
export function computeStreakFromDays(activeDays: Set<number>, now: Date = new Date()): StreakResult {
  if (activeDays.size === 0) return { currentStreak: 0, bestStreak: 0 }

  const sortedDays = Array.from(activeDays).sort((a, b) => a - b)

  let bestStreak = 1
  let run = 1
  for (let i = 1; i < sortedDays.length; i++) {
    run = sortedDays[i] === sortedDays[i - 1] + 1 ? run + 1 : 1
    bestStreak = Math.max(bestStreak, run)
  }

  const todayNumber = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000)
  let cursor = activeDays.has(todayNumber)
    ? todayNumber
    : activeDays.has(todayNumber - 1)
      ? todayNumber - 1
      : null

  let currentStreak = 0
  if (cursor !== null) {
    while (activeDays.has(cursor)) {
      currentStreak += 1
      cursor -= 1
    }
  }

  return { currentStreak, bestStreak }
}

/**
 * Série de jours actifs : au moins une séance terminée par jour civil
 * local. Plusieurs séances le même jour ne comptent qu'une fois.
 * `now` est injectable pour des tests déterministes.
 */
export function computePlankStreak(sessions: PlankSession[], now: Date = new Date()): StreakResult {
  const completedDays = new Set(
    sessions.filter(s => s.status === 'completed').map(s => localDayNumber(s.date))
  )
  return computeStreakFromDays(completedDays, now)
}

export interface PlankTotals {
  totalSessions: number
  totalHoldSeconds: number
  averageDurationSeconds: number
}

export function computePlankTotals(sessions: PlankSession[]): PlankTotals {
  const completed = sessions.filter(s => s.status === 'completed')
  const totalHoldSeconds = completed.reduce((sum, s) => sum + s.totalHoldSeconds, 0)
  return {
    totalSessions: completed.length,
    totalHoldSeconds,
    averageDurationSeconds: completed.length > 0 ? Math.round(totalHoldSeconds / completed.length) : 0,
  }
}

/**
 * Record de maintien continu : basé sur une seule série réellement
 * terminée (statut 'completed'), jamais sur une somme de séries. Les
 * tests initiaux (tenue jusqu'à l'échec) comptent aussi comme des tenues
 * continues valides.
 */
export function computeBestContinuousHold(sessions: PlankSession[], tests: PlankTest[]): number {
  const setMax = sessions
    .flatMap(s => s.sets)
    .filter(set => set.status === 'completed')
    .reduce((max, set) => Math.max(max, set.actualSeconds), 0)
  const testMax = tests.reduce((max, t) => Math.max(max, t.durationSeconds), 0)
  return Math.max(setMax, testMax)
}

function startOfLocalWeek(now: Date): number {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000)
}

export function computeSessionsThisWeek(sessions: PlankSession[], now: Date = new Date()): number {
  const weekStart = startOfLocalWeek(now)
  return sessions.filter(s => s.status === 'completed' && localDayNumber(s.date) >= weekStart).length
}

export interface RecordPoint {
  date: string
  seconds: number
}

/** Série temporelle du record (maximum courant) pour un graphique de progression. */
export function buildRecordProgression(sessions: PlankSession[], tests: PlankTest[]): RecordPoint[] {
  const points: RecordPoint[] = [
    ...tests.map(t => ({ date: t.date, seconds: t.durationSeconds })),
    ...sessions.flatMap(s => s.sets.filter(set => set.status === 'completed').map(set => ({ date: s.date, seconds: set.actualSeconds }))),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  let runningMax = 0
  return points.map(p => {
    runningMax = Math.max(runningMax, p.seconds)
    return { date: p.date, seconds: runningMax }
  })
}
