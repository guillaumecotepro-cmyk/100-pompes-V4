import { CHALLENGE_7_DAYS } from './config'
import { DailyChallengeSettings, JumpSession } from '@/types/rope'
import { localDayNumber } from '../plank/stats'

export interface Challenge7DayState {
  day: number
  targetJumps: number
  achievedJumps: number
  completed: boolean
}

/**
 * Progression du défi 7 jours, entièrement recalculée depuis l'historique
 * (aucun compteur dupliqué) : un jour est réussi dès que le cumul des sauts
 * des séances qui lui sont associées atteint son objectif — une séance
 * partielle n'est donc jamais perdue, elle peut être complétée plus tard.
 */
export function getChallenge7State(sessions: JumpSession[]): Challenge7DayState[] {
  return CHALLENGE_7_DAYS.map(({ day, targetJumps }) => {
    const achievedJumps = sessions
      .filter(s => s.status === 'completed' && s.challengeId === 'challenge7' && s.challengeDay === day)
      .reduce((sum, s) => sum + s.totalJumps, 0)
    return { day, targetJumps, achievedJumps, completed: achievedJumps >= targetJumps }
  })
}

/** Premier jour non réussi — le défi se débloque séquentiellement, sans contrainte de date (§12 : "commencer plus tard"). */
export function getNextChallenge7Day(sessions: JumpSession[]): number | null {
  const state = getChallenge7State(sessions)
  const next = state.find(d => !d.completed)
  return next ? next.day : null
}

export function isChallenge7Complete(sessions: JumpSession[]): boolean {
  return getChallenge7State(sessions).every(d => d.completed)
}

/** Le défi quotidien (sauts et/ou durée) est-il atteint aujourd'hui ? */
export function isDailyChallengeMetToday(
  settings: DailyChallengeSettings,
  sessions: JumpSession[],
  now: Date = new Date()
): boolean {
  if (!settings.enabled) return false
  const todayNumber = localDayNumber(now.toISOString())
  const todaySessions = sessions.filter(s => s.status === 'completed' && localDayNumber(s.date) === todayNumber)
  const todayJumps = todaySessions.reduce((sum, s) => sum + s.totalJumps, 0)
  const todayActiveSeconds = todaySessions.reduce((sum, s) => sum + s.activeDurationSeconds, 0)

  const jumpsOk = settings.targetJumps === null || todayJumps >= settings.targetJumps
  const durationOk = settings.targetDurationSeconds === null || todayActiveSeconds >= settings.targetDurationSeconds
  // Au moins un des deux objectifs configurés (sauts et/ou durée) doit être défini et atteint.
  if (settings.targetJumps === null && settings.targetDurationSeconds === null) return false
  return jumpsOk && durationOk
}
