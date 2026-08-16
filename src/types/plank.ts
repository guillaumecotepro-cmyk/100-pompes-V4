// Types du module Gainage. Isolés de types/index.ts (Pompes) pour ne rien
// risquer sur le modèle existant ; branchés dans AppData via un seul champ `gainage`.

export type PlankVariant = 'forearm' | 'high' | 'side-left' | 'side-right'

export type PlankSessionMode = 'test' | 'program' | 'free'

export type PlankSessionStatus = 'completed' | 'interrupted' | 'cancelled'

export type PlankSetStatus = 'completed' | 'interrupted' | 'skipped'

export type PlankDifficultyFeedback = 'easy' | 'ok' | 'hard'

export type PlankTimerMode = 'countdown' | 'stopwatch'

export interface PlankSet {
  order: number
  variant: PlankVariant
  targetSeconds: number
  actualSeconds: number
  status: PlankSetStatus
}

export interface PlankSession {
  id: string
  mode: PlankSessionMode
  date: string
  plannedDurationSeconds: number
  actualDurationSeconds: number
  totalHoldSeconds: number
  plannedSetCount: number
  sets: PlankSet[]
  restSeconds: number
  status: PlankSessionStatus
  difficultyFeedback: PlankDifficultyFeedback | null
  programId: string | null
  programSessionIndex: number | null
}

export interface PlankTest {
  id: string
  date: string
  durationSeconds: number
}

export interface PlankProgramSet {
  targetSeconds: number
  restSeconds: number
}

export interface PlankProgramSession {
  index: number
  week: number
  day: number
  sets: PlankProgramSet[]
  isGoalAttempt: boolean
  status: 'pending' | 'done' | 'to_redo'
}

export interface PlankProgramAdaptation {
  sessionIndex: number
  feedback: PlankDifficultyFeedback
  adjustmentSeconds: number
  appliedAt: string
}

export type PlankProgramStatus = 'active' | 'completed' | 'abandoned'

export interface PlankProgram {
  id: string
  generatorVersion: number
  goalSeconds: number
  initialSeconds: number
  startDate: string
  status: PlankProgramStatus
  currentSessionIndex: number
  sessions: PlankProgramSession[]
  adaptations: PlankProgramAdaptation[]
}

export interface PlankSettings {
  voiceEnabled: boolean
  beepEnabled: boolean
  gongEnabled: boolean
  vibrationEnabled: boolean
  restSeconds: number
}

export interface GainageData {
  onboarded: boolean
  settings: PlankSettings
  tests: PlankTest[]
  programs: PlankProgram[]
  activeProgramId: string | null
  sessions: PlankSession[]
  earnedBadges: string[]
  draftSession: PlankDraftSession | null
}

// Séance en cours, sauvegardée pour permettre reprise/abandon propre après
// fermeture accidentelle de l'app (jamais auto-complétée).
export interface PlankDraftSession {
  id: string
  mode: PlankSessionMode
  startedAt: string
  plannedDurationSeconds: number
  plannedSetCount: number
  restSeconds: number
  programId: string | null
  programSessionIndex: number | null
  variant: PlankVariant
}

export interface PlankBadgeDef {
  id: string
  name: string
  description: string
  icon: string
}
