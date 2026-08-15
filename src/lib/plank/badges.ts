import { GainageData, PlankBadgeDef } from '@/types/plank'
import { pickNewlyUnlocked } from '@/lib/utils'
import { computePlankStreak, computePlankTotals, computeBestContinuousHold } from './stats'

export const ALL_PLANK_BADGES: PlankBadgeDef[] = [
  { id: 'plank_first',      name: 'Premier gainage', icon: '🧘', description: 'Terminer votre première séance de gainage' },
  { id: 'plank_hold_30',    name: '30 secondes',     icon: '⏱️', description: 'Tenir 30 s en une seule série' },
  { id: 'plank_hold_45',    name: '45 secondes',     icon: '⏱️', description: 'Tenir 45 s en une seule série' },
  { id: 'plank_hold_60',    name: '1 minute',        icon: '⏱️', description: 'Tenir 1 min en une seule série' },
  { id: 'plank_hold_75',    name: '1 min 15',        icon: '⏱️', description: 'Tenir 1 min 15 en une seule série' },
  { id: 'plank_hold_90',    name: '1 min 30',        icon: '⏱️', description: 'Tenir 1 min 30 en une seule série' },
  { id: 'plank_hold_105',   name: '1 min 45',        icon: '⏱️', description: 'Tenir 1 min 45 en une seule série' },
  { id: 'plank_hold_120',   name: '2 minutes',       icon: '🏆', description: 'Tenir 2 min en une seule série' },
  { id: 'plank_streak_3',   name: 'Régulier',        icon: '🔥', description: '3 jours consécutifs' },
  { id: 'plank_streak_7',   name: 'Une semaine solide', icon: '⚡', description: '7 jours consécutifs' },
  { id: 'plank_sessions_10', name: '10 séances',     icon: '📅', description: '10 séances terminées' },
  { id: 'plank_sessions_25', name: '25 séances',     icon: '📅', description: '25 séances terminées' },
  { id: 'plank_sessions_50', name: '50 séances',     icon: '📅', description: '50 séances terminées' },
  { id: 'plank_cumul_10',   name: '10 minutes cumulées', icon: '⌛', description: '10 min de gainage cumulées' },
  { id: 'plank_cumul_30',   name: '30 minutes cumulées', icon: '⌛', description: '30 min de gainage cumulées' },
  { id: 'plank_cumul_60',   name: '1 heure cumulée', icon: '⌛', description: '1 h de gainage cumulée' },
  { id: 'plank_goal_reached', name: 'Objectif atteint', icon: '🎯', description: 'Programme terminé et objectif réussi' },
]

/**
 * Moteur de badges Gainage — utilise le même mécanisme générique que
 * Pompes (`pickNewlyUnlocked`) mais avec ses propres ids et seuils,
 * stockés dans `gainage.earnedBadges` (namespace séparé, aucune
 * interférence avec les déblocages Pompes existants).
 */
export function checkNewPlankBadges(gainage: GainageData, goalReached: boolean, now: Date = new Date()): string[] {
  const totals = computePlankTotals(gainage.sessions)
  const { currentStreak } = computePlankStreak(gainage.sessions, now)
  const bestHold = computeBestContinuousHold(gainage.sessions, gainage.tests)

  return pickNewlyUnlocked(gainage.earnedBadges, {
    plank_first:       totals.totalSessions >= 1,
    plank_hold_30:     bestHold >= 30,
    plank_hold_45:     bestHold >= 45,
    plank_hold_60:     bestHold >= 60,
    plank_hold_75:     bestHold >= 75,
    plank_hold_90:     bestHold >= 90,
    plank_hold_105:    bestHold >= 105,
    plank_hold_120:    bestHold >= 120,
    plank_streak_3:    currentStreak >= 3,
    plank_streak_7:    currentStreak >= 7,
    plank_sessions_10: totals.totalSessions >= 10,
    plank_sessions_25: totals.totalSessions >= 25,
    plank_sessions_50: totals.totalSessions >= 50,
    plank_cumul_10:    totals.totalHoldSeconds >= 600,
    plank_cumul_30:    totals.totalHoldSeconds >= 1_800,
    plank_cumul_60:    totals.totalHoldSeconds >= 3_600,
    plank_goal_reached: goalReached,
  })
}
