import { GainageData } from './plank'

export type Level = 'beginner' | 'intermediate' | 'advanced' | 'elite'
export type SensorMode = 'tap'
export type RhythmQuality = 'fast' | 'good' | 'slow' | 'idle'
export type WorkoutPhase = 'preparing' | 'active' | 'resting' | 'completed' | 'paused'
export type ActivityType = 'pompes' | 'gainage'

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
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
}
