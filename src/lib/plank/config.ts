// Configuration centralisée du module Gainage — toutes les constantes
// modifiables du cahier des charges vivent ici, jamais en dur dans les écrans.

export const PLANK_GOAL_PRESETS_SECONDS = [30, 45, 60, 75, 90, 105, 120] as const
export type PlankGoalPreset = (typeof PLANK_GOAL_PRESETS_SECONDS)[number]

export const CUSTOM_GOAL_MIN_SECONDS = 10
export const CUSTOM_GOAL_MAX_SECONDS = 600 // 10 minutes

export const DEFAULT_REST_SECONDS = 30
export const MIN_SET_SECONDS = 10
export const DURATION_ROUNDING_STEP = 5

export const PROGRAM_WEEKS = 4
export const PROGRAM_SESSIONS_PER_WEEK = 3
export const PROGRAM_TOTAL_SESSIONS = PROGRAM_WEEKS * PROGRAM_SESSIONS_PER_WEEK
export const PROGRAM_GENERATOR_VERSION = 1

// Ajustement borné après feedback de séance ("trop facile" / "trop difficile").
export const FEEDBACK_EASY_INCREMENT_SECONDS = 5
export const FEEDBACK_HARD_DECREMENT_SECONDS = 10
export const FEEDBACK_MAX_CUMULATIVE_SHIFT_SECONDS = 30

/**
 * Objectif recommandé à partir du résultat du test initial, selon le
 * barème du cahier des charges. Au-delà de 120 s, aucune recommandation
 * automatique unique n'a de sens : on retourne 120 (entretien) et l'écran
 * propose explicitement le choix "entretien / objectif personnalisé".
 */
export function recommendGoalSeconds(resultSeconds: number): number {
  if (resultSeconds < 30) return 30
  if (resultSeconds < 45) return 45
  if (resultSeconds < 60) return 60
  if (resultSeconds < 75) return 75
  if (resultSeconds < 90) return 90
  if (resultSeconds < 105) return 105
  return 120
}

export const DEFAULT_PLANK_SETTINGS = {
  voiceEnabled: true,
  beepEnabled: true,
  gongEnabled: true,
  vibrationEnabled: true,
  restSeconds: DEFAULT_REST_SECONDS,
  reminders: {
    enabled: false,
    days: [] as number[],
    hour: 18,
    minute: 0,
  },
}
