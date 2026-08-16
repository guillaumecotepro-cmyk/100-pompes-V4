import { GainageData, PlankSettings } from './plank'
import { JumpRopeData } from './rope'

export type Level = 'beginner' | 'intermediate' | 'advanced' | 'elite'
export type SensorMode = 'tap'
export type RhythmQuality = 'fast' | 'good' | 'slow' | 'idle'
export type WorkoutPhase = 'preparing' | 'active' | 'resting' | 'completed' | 'paused'
export type ActivityType = 'pompes' | 'gainage' | 'jumprope'

export interface UserProfile {
  id: string
  name: string
  initialTestScore: number
  level: Level
  createdAt: string
  avatarColor: string
  avatarImage?: string | null
}

export interface UserStats {
  totalPushups: number
  totalSessions: number
  currentStreak: number
  bestStreak: number
  bestSingleSet: number
  bestSession: number
  lastSessionDate: string | null
  weeklyPushups: number
}

export interface ProgramSet {
  reps: number
  restSeconds: number
}

export interface ProgramSession {
  index: number
  day: number
  week: number
  sets: ProgramSet[]
  totalTarget: number
  focus: string
}

export interface WorkoutProgram {
  level: Level
  initialScore: number
  goal: number
  sessions: ProgramSession[]
  currentSessionIndex: number
  startDate: string
}

export interface CompletedSet {
  targetReps: number
  completedReps: number
  duration: number
}

export interface WorkoutHistory {
  id: string
  date: string
  sessionIndex: number
  week: number
  day: number
  sets: CompletedSet[]
  totalReps: number
  targetReps: number
  completed: boolean
  duration: number
}

export interface MaxPerformanceRecord {
  id: string
  date: string
  reps: number
  duration: number
  sensorMode: SensorMode
}

/**
 * Séance libre Pompes — équivalent de la séance libre Gainage, adapté aux
 * répétitions : minuteur (AMRAP), chronomètre libre, ou objectif de reps.
 */
export type PompesFreeMode = 'timer' | 'stopwatch' | 'target'

export interface PompesFreeSet {
  order: number
  mode: PompesFreeMode
  targetSeconds: number | null
  targetReps: number | null
  actualReps: number
  actualDurationSeconds: number
  status: 'completed' | 'interrupted'
}

export interface PompesFreeSession {
  id: string
  date: string
  mode: PompesFreeMode
  plannedSetCount: number
  restSeconds: number
  sets: PompesFreeSet[]
  totalReps: number
  actualDurationSeconds: number
  status: 'completed' | 'interrupted' | 'cancelled'
}

/** Rappel unique, partagé entre Pompes et Gainage (une seule config au lieu de deux). */
export interface RemindersSettings {
  enabled: boolean
  days: number[] // 0 (dimanche) .. 6 (samedi)
  hour: number
  minute: number
  activities: ActivityType[]
}

export interface AppData {
  schemaVersion: number
  updatedAt: string | null
  profile: UserProfile | null
  stats: UserStats
  program: WorkoutProgram | null
  history: WorkoutHistory[]
  maxHistory: MaxPerformanceRecord[]
  earnedBadges: string[]
  onboarded: boolean
  preferredSensorMode: SensorMode
  gainage: GainageData
  reminders: RemindersSettings
  pompesFreeHistory: PompesFreeSession[]
  pompesAudioSettings: PlankSettings
  jumprope: JumpRopeData
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
}
