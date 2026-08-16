// Configuration centralisée du module Corde à sauter.

export const JUMP_GOAL_PRESETS = [50, 100, 250, 500, 750, 1_000, 1_500, 2_000] as const
export const DURATION_GOAL_PRESETS_SECONDS = [60, 180, 300, 600, 900, 1_200, 1_800] as const

export const CUSTOM_JUMPS_MIN = 10
export const CUSTOM_JUMPS_MAX = 10_000
export const CUSTOM_DURATION_MIN_SECONDS = 30
export const CUSTOM_DURATION_MAX_SECONDS = 3_600

export const DEFAULT_REST_SECONDS = 30

export interface IntervalTemplate {
  id: string
  name: string
  workSeconds: number
  restSeconds: number
  rounds: number
  warmupSeconds: number
  cooldownSeconds: number
  isPyramid?: boolean
}

// La pyramide alterne des blocs de travail croissants puis décroissants ;
// gérée séparément dans le générateur (buildIntervalPlan) via `isPyramid`.
export const INTERVAL_TEMPLATES: IntervalTemplate[] = [
  { id: 'classic_20_10',  name: '20 s / 10 s',       workSeconds: 20, restSeconds: 10, rounds: 8,  warmupSeconds: 60, cooldownSeconds: 60 },
  { id: 'classic_30_15',  name: '30 s / 15 s',       workSeconds: 30, restSeconds: 15, rounds: 8,  warmupSeconds: 60, cooldownSeconds: 60 },
  { id: 'classic_45_15',  name: '45 s / 15 s',       workSeconds: 45, restSeconds: 15, rounds: 6,  warmupSeconds: 90, cooldownSeconds: 60 },
  { id: 'classic_60_30',  name: '60 s / 30 s',       workSeconds: 60, restSeconds: 30, rounds: 6,  warmupSeconds: 90, cooldownSeconds: 90 },
  { id: 'tabata',         name: 'Tabata 8 × 20 s / 10 s', workSeconds: 20, restSeconds: 10, rounds: 8, warmupSeconds: 120, cooldownSeconds: 60 },
  { id: 'pyramid',        name: 'Pyramide',          workSeconds: 20, restSeconds: 15, rounds: 7,  warmupSeconds: 90, cooldownSeconds: 90, isPyramid: true },
]

export const ANNOUNCE_EVERY_OPTIONS = [0, 10, 25, 50, 100] as const

export const SESSION_DURATION_PRESETS_SECONDS = [300, 600, 900, 1_200, 1_800] as const // 5/10/15/20/30 min, onboarding

export const TRAINING_DAYS_OPTIONS = [2, 3, 4, 5, 6] as const

/**
 * Estimation calorique — formule MET (équivalent métabolique) documentée :
 * kcal = MET × poids(kg) × durée_active(h). Le MET de la corde à sauter
 * varie avec la cadence (effort plus ou moins intense). Volontairement
 * prudente : toujours présentée comme une ESTIMATION, jamais une mesure
 * médicale exacte.
 */
export function estimateMetFromCadence(avgCadenceJumpsPerMinute: number): number {
  if (avgCadenceJumpsPerMinute <= 0) return 3
  if (avgCadenceJumpsPerMinute < 60) return 8.8   // rythme lent
  if (avgCadenceJumpsPerMinute < 100) return 11.8 // rythme modéré
  if (avgCadenceJumpsPerMinute < 140) return 12.3 // rythme soutenu
  return 12.8 // rythme rapide
}

export function estimateCalories(activeDurationSeconds: number, avgCadence: number, weightKg: number | null): number {
  const weight = weightKg && weightKg > 0 ? weightKg : 70 // poids moyen par défaut si non renseigné
  const met = estimateMetFromCadence(avgCadence)
  const hours = activeDurationSeconds / 3600
  return Math.round(met * weight * hours)
}

export const DEFAULT_JUMPROPE_SETTINGS = {
  voiceEnabled: true,
  beepEnabled: true,
  gongEnabled: true,
  vibrationEnabled: true,
  announceEveryNJumps: 25 as const,
  announceHalfway: true,
  preferredCountingMethod: 'manual' as const,
  recordVideoByDefault: false,
  restSeconds: DEFAULT_REST_SECONDS,
}

export const CHALLENGE_7_DAYS = [
  { day: 1, targetJumps: 250 },
  { day: 2, targetJumps: 300 },
  { day: 3, targetJumps: 350 },
  { day: 4, targetJumps: 400 },
  { day: 5, targetJumps: 450 },
  { day: 6, targetJumps: 500 },
  { day: 7, targetJumps: 500 },
]

/** Développe un modèle d'intervalle en une liste de blocs échauffement/travail/repos/récupération, prête pour le lecteur de séance. */
export function buildIntervalBlocks(template: IntervalTemplate): { type: 'warmup' | 'work' | 'rest' | 'cooldown'; durationSeconds: number; targetJumps: null; label: string }[] {
  const blocks: { type: 'warmup' | 'work' | 'rest' | 'cooldown'; durationSeconds: number; targetJumps: null; label: string }[] = []
  if (template.warmupSeconds > 0) blocks.push({ type: 'warmup', durationSeconds: template.warmupSeconds, targetJumps: null, label: 'Échauffement' })

  if (template.isPyramid) {
    const steps = Array.from({ length: template.rounds }, (_, i) => {
      const half = Math.ceil(template.rounds / 2)
      const step = i < half ? i + 1 : template.rounds - i
      return template.workSeconds * step
    })
    steps.forEach((workSeconds, i) => {
      blocks.push({ type: 'work', durationSeconds: workSeconds, targetJumps: null, label: `Palier ${i + 1}/${steps.length}` })
      if (i < steps.length - 1) blocks.push({ type: 'rest', durationSeconds: template.restSeconds, targetJumps: null, label: 'Repos' })
    })
  } else {
    for (let r = 0; r < template.rounds; r++) {
      blocks.push({ type: 'work', durationSeconds: template.workSeconds, targetJumps: null, label: `Travail ${r + 1}/${template.rounds}` })
      if (r < template.rounds - 1) blocks.push({ type: 'rest', durationSeconds: template.restSeconds, targetJumps: null, label: 'Repos' })
    }
  }

  if (template.cooldownSeconds > 0) blocks.push({ type: 'cooldown', durationSeconds: template.cooldownSeconds, targetJumps: null, label: 'Récupération finale' })
  return blocks
}

// Plage physiologiquement plausible pour une cadence de corde à sauter
// (sauts par minute). Utilisée par les deux moteurs de comptage pour
// rejeter les faux positifs et par les badges de vitesse.
export const MIN_PLAUSIBLE_CADENCE = 20
export const MAX_PLAUSIBLE_CADENCE = 260
