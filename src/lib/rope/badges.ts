import { JumpBadgeDef, JumpRopeData } from '@/types/rope'
import { pickNewlyUnlocked } from '@/lib/utils'
import {
  computeJumpTotals, computeJumpStreak, computeBestSessionJumps,
  computeBestValidatedCadence, computeBestActiveDuration,
} from './stats'

/** Durée active minimale (s) pour qu'une cadence de pointe soit prise en compte (cohérent avec computeBestValidatedCadence). */
const MIN_CADENCE_ACTIVE_SECONDS = 20

// ── Premiers pas — 8 paliers sur le nombre de séances terminées ────
const DEBUTS = [1, 2, 3, 5, 7, 10, 15, 20]
// ── Maître du saut — 10 paliers sur le total cumulé de sauts ───────
const VOLUME = [500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 150_000, 250_000]
// ── Séries — 8 paliers sur le meilleur streak de jours actifs ──────
const SERIES = [2, 3, 5, 7, 14, 30, 60, 100]
// ── Grosses séances — 8 paliers sur le nombre de sauts en 1 séance ─
const GROSSES_SEANCES = [100, 250, 500, 750, 1_000, 1_500, 2_000, 3_000]
// ── Vitesse — 8 paliers sur la meilleure cadence validée ───────────
const VITESSE = [80, 100, 120, 140, 160, 180, 190, 200]
// ── Endurance — 8 paliers sur la durée active d'une seule séance ───
const ENDURANCE_SECONDS = [300, 600, 900, 1_200, 1_800, 2_400, 3_000, 3_600]

function tierFor(index: number, count: number): JumpBadgeDef['tier'] {
  const ratio = index / count
  if (ratio < 0.4) return 'bronze'
  if (ratio < 0.75) return 'argent'
  return 'or'
}

function formatCount(n: number): string {
  return n.toLocaleString('fr-FR')
}

function formatMinutes(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  return minutes >= 1 ? `${minutes} min` : `${seconds} s`
}

function buildDebutsBadges(): JumpBadgeDef[] {
  return DEBUTS.map((n, i) => ({
    id: `jr_debuts_${n}`,
    name: n === 1 ? 'Première séance' : `${n} séances`,
    description: n === 1 ? 'Terminer votre première séance de corde à sauter' : `Terminer ${n} séances de corde à sauter`,
    icon: i < 3 ? '🩰' : i < 6 ? '🌱' : '🚪',
    category: 'debuts',
    tier: tierFor(i, DEBUTS.length),
  }))
}

function buildVolumeBadges(): JumpBadgeDef[] {
  return VOLUME.map((n, i) => ({
    id: `jr_volume_${n}`,
    name: `${formatCount(n)} sauts cumulés`,
    description: `Atteindre ${formatCount(n)} sauts cumulés (toutes séances confondues)`,
    icon: i < 4 ? '🪢' : i < 8 ? '⭐' : '👑',
    category: 'volume',
    tier: tierFor(i, VOLUME.length),
  }))
}

function buildSeriesBadges(): JumpBadgeDef[] {
  return SERIES.map((n, i) => ({
    id: `jr_series_${n}`,
    name: `${n} jours consécutifs`,
    description: `Rester actif ${n} jours consécutifs (corde à sauter)`,
    icon: i < 3 ? '🔥' : i < 6 ? '⚡' : '🏛️',
    category: 'series',
    tier: tierFor(i, SERIES.length),
  }))
}

function buildGrossesSeancesBadges(): JumpBadgeDef[] {
  return GROSSES_SEANCES.map((n, i) => ({
    id: `jr_grosse_seance_${n}`,
    name: `${formatCount(n)} sauts en une séance`,
    description: `Réaliser ${formatCount(n)} sauts en une seule séance`,
    icon: i < 3 ? '💪' : i < 6 ? '🏆' : '💎',
    category: 'grosses_seances',
    tier: tierFor(i, GROSSES_SEANCES.length),
  }))
}

function buildVitesseBadges(): JumpBadgeDef[] {
  return VITESSE.map((n, i) => ({
    id: `jr_vitesse_${n}`,
    name: `${n} sauts/min`,
    description: `Valider une cadence moyenne d'au moins ${n} sauts/min sur une séance d'au moins ${MIN_CADENCE_ACTIVE_SECONDS} s`,
    icon: i < 3 ? '💨' : i < 6 ? '🚀' : '⚡',
    category: 'vitesse',
    tier: tierFor(i, VITESSE.length),
  }))
}

function buildEnduranceBadges(): JumpBadgeDef[] {
  return ENDURANCE_SECONDS.map((s, i) => ({
    id: `jr_endurance_${s}`,
    name: `${formatMinutes(s)} d'activité continue`,
    description: `Cumuler ${formatMinutes(s)} de temps actif sur une seule séance`,
    icon: i < 3 ? '🫁' : i < 6 ? '🏃' : '🦾',
    category: 'endurance',
    tier: tierFor(i, ENDURANCE_SECONDS.length),
  }))
}

export const ALL_JUMP_BADGES: JumpBadgeDef[] = [
  ...buildDebutsBadges(),
  ...buildVolumeBadges(),
  ...buildSeriesBadges(),
  ...buildGrossesSeancesBadges(),
  ...buildVitesseBadges(),
  ...buildEnduranceBadges(),
]

/**
 * Moteur de badges Corde à sauter — même mécanisme générique que Gainage
 * (`pickNewlyUnlocked`), avec ses propres ids stockés dans
 * `jumprope.earnedBadges`. Toute la progression est recalculée depuis
 * l'historique des séances à chaque appel : aucun compteur dupliqué,
 * donc aucun risque d'incohérence.
 */
export function checkNewJumpBadges(jumprope: JumpRopeData, now: Date = new Date()): string[] {
  const totals = computeJumpTotals(jumprope.sessions)
  const { currentStreak, bestStreak } = computeJumpStreak(jumprope.sessions, now)
  const bestSessionJumps = computeBestSessionJumps(jumprope.sessions)
  const bestCadence = computeBestValidatedCadence(jumprope.sessions, MIN_CADENCE_ACTIVE_SECONDS)
  const bestActiveDuration = computeBestActiveDuration(jumprope.sessions)
  const bestStreakEver = Math.max(currentStreak, bestStreak)

  const conditions: Record<string, boolean> = {}
  for (const n of DEBUTS) conditions[`jr_debuts_${n}`] = totals.totalSessions >= n
  for (const n of VOLUME) conditions[`jr_volume_${n}`] = totals.totalJumps >= n
  for (const n of SERIES) conditions[`jr_series_${n}`] = bestStreakEver >= n
  for (const n of GROSSES_SEANCES) conditions[`jr_grosse_seance_${n}`] = bestSessionJumps >= n
  for (const n of VITESSE) conditions[`jr_vitesse_${n}`] = bestCadence >= n
  for (const s of ENDURANCE_SECONDS) conditions[`jr_endurance_${s}`] = bestActiveDuration >= s

  return pickNewlyUnlocked(jumprope.earnedBadges, conditions)
}
