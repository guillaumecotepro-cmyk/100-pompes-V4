// Types du module Corde à sauter. Isolés de types/index.ts (Pompes) et
// types/plank.ts (Gainage) — branchés dans AppData via un seul champ
// `jumprope`, suivant exactement le même patron que Gainage.

export type JumpCountingMethod = 'camera' | 'motion' | 'manual' | 'bluetooth'

export type JumpSessionMode =
  | 'free'
  | 'goal_jumps'
  | 'goal_duration'
  | 'intervals'
  | 'daily_challenge'
  | 'program'
  | 'challenge7'

export type JumpSessionStatus = 'completed' | 'interrupted' | 'cancelled'

export interface JumpSeries {
  order: number
  jumps: number
  durationSeconds: number
  activeDurationSeconds: number
  avgCadence: number
  maxCadence: number
  bestStreak: number
  status: 'completed' | 'interrupted'
}

export interface JumpJournalEntry {
  feeling: 1 | 2 | 3 | 4 | 5 | null
  perceivedDifficulty: number | null // 1-10
  fatigue: number | null // 1-10
  pain: boolean
  comment: string | null
}

export interface JumpSession {
  id: string
  mode: JumpSessionMode
  date: string
  endDate: string
  timezone: string
  totalDurationSeconds: number
  activeDurationSeconds: number
  totalJumps: number
  avgCadence: number
  maxCadence: number
  caloriesEstimated: number
  heartRateAvg: number | null
  countingMethod: JumpCountingMethod
  countingAlgorithmVersion: number
  series: JumpSeries[]
  bestStreak: number
  manualCorrection: boolean
  notes: string | null
  journal: JumpJournalEntry | null
  programId: string | null
  programWorkoutIndex: number | null
  challengeId: 'challenge7' | null
  challengeDay: number | null
  status: JumpSessionStatus
  clipId: string | null
  virtual: boolean
}

/** Séance en cours, sauvegardée pour permettre reprise/abandon propre. */
export interface JumpDraftSession {
  id: string
  mode: JumpSessionMode
  startedAt: string
  countingMethod: JumpCountingMethod
  programId: string | null
  programWorkoutIndex: number | null
}

// ── Profil & réglages ──────────────────────────────────────────────

export type JumpMainGoal = 'lose_weight' | 'endurance' | 'active_daily' | 'performance' | 'competition'
export type JumpLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type JumpUnits = 'metric' | 'imperial'

export interface JumpRopeProfile {
  ageYears: number | null
  gender: 'male' | 'female' | 'other' | null
  heightCm: number | null
  weightKg: number | null
  units: JumpUnits
  mainGoal: JumpMainGoal
  level: JumpLevel
  trainingDaysPerWeek: number
  preferredDays: number[]
  reminderTime: { hour: number; minute: number } | null
  preferredSessionDurationSeconds: number
}

export interface JumpRopeSettings {
  voiceEnabled: boolean
  beepEnabled: boolean
  gongEnabled: boolean
  vibrationEnabled: boolean
  announceEveryNJumps: 0 | 10 | 25 | 50 | 100
  announceHalfway: boolean
  preferredCountingMethod: JumpCountingMethod
  recordVideoByDefault: boolean
  restSeconds: number
}

// ── Programmes déterministes (catalogue statique) ─────────────────

export type JumpProgramId = 'first-steps' | 'burn-sculpt' | 'iron-lungs' | 'afterburn'

export interface JumpProgramBlock {
  type: 'warmup' | 'work' | 'rest' | 'cooldown'
  durationSeconds: number
  targetJumps: number | null
  label: string
}

export interface JumpProgramWorkout {
  index: number
  week: number
  day: number
  title: string
  blocks: JumpProgramBlock[]
  estimatedCalories: number
}

export interface JumpProgramDef {
  id: JumpProgramId
  name: string
  level: JumpLevel
  description: string
  goal: string
  weeks: number
  sessionsPerWeek: number
  workouts: JumpProgramWorkout[]
}

export interface JumpProgramProgress {
  programId: JumpProgramId
  startDate: string
  currentWorkoutIndex: number
  workoutStatus: Record<number, 'pending' | 'done' | 'to_redo'>
  status: 'active' | 'completed' | 'abandoned'
}

// ── Défi 7 jours & défi quotidien ──────────────────────────────────

export interface JumpChallenge7Progress {
  startDate: string | null
  completedDays: number[]
  status: 'not_started' | 'active' | 'completed'
}

export interface DailyChallengeSettings {
  enabled: boolean
  targetJumps: number | null
  targetDurationSeconds: number | null
}

// ── Appareils, santé, classement ───────────────────────────────────

export interface DeviceConnectionState {
  type: 'motion_sensor' | 'bluetooth_rope' | 'headphones' | 'watch'
  supported: boolean
  connected: boolean
  lastSeenAt: string | null
}

export interface HealthSyncState {
  appleHealthAvailable: boolean
  healthConnectAvailable: boolean
  enabled: boolean
  lastSyncedAt: string | null
}

export interface LeaderboardConsent {
  optedIn: boolean
  pseudonym: string | null
  country: string | null
}

export interface RecordedClipMeta {
  id: string
  sessionId: string | null
  createdAt: string
  durationSeconds: number
  sizeBytes: number
  name: string
}

export interface JumpBadgeDef {
  id: string
  name: string
  description: string
  icon: string
  category: 'debuts' | 'volume' | 'series' | 'grosses_seances' | 'vitesse' | 'endurance'
  tier: 'bronze' | 'argent' | 'or' | null
}

// ── État global du module ──────────────────────────────────────────

export interface JumpRopeData {
  onboarded: boolean
  profile: JumpRopeProfile | null
  settings: JumpRopeSettings
  sessions: JumpSession[]
  programProgress: Record<JumpProgramId, JumpProgramProgress | null>
  activeProgramId: JumpProgramId | null
  challenge7: JumpChallenge7Progress
  dailyChallenge: DailyChallengeSettings
  earnedBadges: string[]
  clips: RecordedClipMeta[]
  deviceConnections: DeviceConnectionState[]
  healthSync: HealthSyncState
  leaderboard: LeaderboardConsent
  draftSession: JumpDraftSession | null
}
