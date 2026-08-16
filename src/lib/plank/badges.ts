import { GainageData, PlankBadgeDef } from '@/types/plank'
import { pickNewlyUnlocked } from '@/lib/utils'
import { computePlankStreak, computePlankTotals, computeBestContinuousHold } from './stats'

export const ALL_PLANK_BADGES: PlankBadgeDef[] = [
  { id: 'plank_first',      name: 'Premier gainage', icon: '🧘', description: 'Terminer votre première séance de gainage' },

  // Record de maintien continu (une seule série)
  { id: 'plank_hold_30',    name: '30 secondes',     icon: '⏱️', description: 'Tenir 30 s en une seule série' },
  { id: 'plank_hold_45',    name: '45 secondes',     icon: '⏱️', description: 'Tenir 45 s en une seule série' },
  { id: 'plank_hold_60',    name: '1 minute',        icon: '⏱️', description: 'Tenir 1 min en une seule série' },
  { id: 'plank_hold_75',    name: '1 min 15',        icon: '⏱️', description: 'Tenir 1 min 15 en une seule série' },
  { id: 'plank_hold_90',    name: '1 min 30',        icon: '⏱️', description: 'Tenir 1 min 30 en une seule série' },
  { id: 'plank_hold_105',   name: '1 min 45',        icon: '⏱️', description: 'Tenir 1 min 45 en une seule série' },
  { id: 'plank_hold_120',   name: '2 minutes',       icon: '🏆', description: 'Tenir 2 min en une seule série' },
  { id: 'plank_hold_150',   name: '2 min 30',        icon: '⏱️', description: 'Tenir 2 min 30 en une seule série' },
  { id: 'plank_hold_180',   name: '3 minutes',       icon: '🏆', description: 'Tenir 3 min en une seule série' },
  { id: 'plank_hold_240',   name: '4 minutes',       icon: '💎', description: 'Tenir 4 min en une seule série' },
  { id: 'plank_hold_300',   name: '5 minutes',       icon: '👑', description: 'Tenir 5 min en une seule série' },

  // Série de jours consécutifs
  { id: 'plank_streak_3',   name: 'Régulier',          icon: '🔥', description: '3 jours consécutifs' },
  { id: 'plank_streak_7',   name: 'Une semaine solide', icon: '⚡', description: '7 jours consécutifs' },
  { id: 'plank_streak_14',  name: 'Deux semaines',     icon: '🌟', description: '14 jours consécutifs' },
  { id: 'plank_streak_30',  name: 'Un mois entier',    icon: '👑', description: '30 jours consécutifs' },
  { id: 'plank_streak_60',  name: 'Inarrêtable',       icon: '🚀', description: '60 jours consécutifs' },
  { id: 'plank_streak_100', name: 'Centurion',         icon: '🏛️', description: '100 jours consécutifs' },

  // Nombre de séances terminées (programme + libre)
  { id: 'plank_sessions_5',   name: '5 séances',    icon: '📆', description: '5 séances terminées' },
  { id: 'plank_sessions_10',  name: '10 séances',   icon: '📅', description: '10 séances terminées' },
  { id: 'plank_sessions_25',  name: '25 séances',   icon: '📅', description: '25 séances terminées' },
  { id: 'plank_sessions_50',  name: '50 séances',   icon: '📅', description: '50 séances terminées' },
  { id: 'plank_sessions_100', name: '100 séances',  icon: '🎖️', description: '100 séances terminées' },
  { id: 'plank_sessions_250', name: '250 séances',  icon: '🏆', description: '250 séances terminées' },

  // Temps cumulé de gainage (programme + libre)
  { id: 'plank_cumul_5',    name: '5 minutes cumulées',   icon: '⌛', description: '5 min de gainage cumulées' },
  { id: 'plank_cumul_10',   name: '10 minutes cumulées',  icon: '⌛', description: '10 min de gainage cumulées' },
  { id: 'plank_cumul_30',   name: '30 minutes cumulées',  icon: '⌛', description: '30 min de gainage cumulées' },
  { id: 'plank_cumul_60',   name: '1 heure cumulée',      icon: '⌛', description: '1 h de gainage cumulée' },
  { id: 'plank_cumul_120',  name: '2 heures cumulées',    icon: '⏳', description: '2 h de gainage cumulées' },
  { id: 'plank_cumul_300',  name: '5 heures cumulées',    icon: '⏳', description: '5 h de gainage cumulées' },
  { id: 'plank_cumul_600',  name: '10 heures cumulées',   icon: '💎', description: '10 h de gainage cumulées' },

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
    plank_first: totals.totalSessions >= 1,

    plank_hold_30:  bestHold >= 30,
    plank_hold_45:  bestHold >= 45,
    plank_hold_60:  bestHold >= 60,
    plank_hold_75:  bestHold >= 75,
    plank_hold_90:  bestHold >= 90,
    plank_hold_105: bestHold >= 105,
    plank_hold_120: bestHold >= 120,
    plank_hold_150: bestHold >= 150,
    plank_hold_180: bestHold >= 180,
    plank_hold_240: bestHold >= 240,
    plank_hold_300: bestHold >= 300,

    plank_streak_3:   currentStreak >= 3,
    plank_streak_7:   currentStreak >= 7,
    plank_streak_14:  currentStreak >= 14,
    plank_streak_30:  currentStreak >= 30,
    plank_streak_60:  currentStreak >= 60,
    plank_streak_100: currentStreak >= 100,

    plank_sessions_5:   totals.totalSessions >= 5,
    plank_sessions_10:  totals.totalSessions >= 10,
    plank_sessions_25:  totals.totalSessions >= 25,
    plank_sessions_50:  totals.totalSessions >= 50,
    plank_sessions_100: totals.totalSessions >= 100,
    plank_sessions_250: totals.totalSessions >= 250,

    plank_cumul_5:   totals.totalHoldSeconds >= 300,
    plank_cumul_10:  totals.totalHoldSeconds >= 600,
    plank_cumul_30:  totals.totalHoldSeconds >= 1_800,
    plank_cumul_60:  totals.totalHoldSeconds >= 3_600,
    plank_cumul_120: totals.totalHoldSeconds >= 7_200,
    plank_cumul_300: totals.totalHoldSeconds >= 18_000,
    plank_cumul_600: totals.totalHoldSeconds >= 36_000,

    plank_goal_reached: goalReached,
  })
}
