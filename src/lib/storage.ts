import { AppData, UserStats, WorkoutHistory } from '@/types'
import { ALL_BADGES } from './programGenerator'

export const STORAGE_SCHEMA_VERSION = 2
export const STORAGE_KEY = '100pompes_v1'
export const STORAGE_BACKUP_KEY = '100pompes_v1_backup'
export const LEGACY_STORAGE_KEYS = ['100pompes_data']

export const DEFAULT_STATS: UserStats = {
  totalPushups: 0,
  totalSessions: 0,
  currentStreak: 0,
  bestStreak: 0,
  bestSingleSet: 0,
  bestSession: 0,
  lastSessionDate: null,
  weeklyPushups: 0,
}

export const DEFAULT_APP_DATA: AppData = {
  schemaVersion: STORAGE_SCHEMA_VERSION,
  updatedAt: null,
  profile: null,
  stats: DEFAULT_STATS,
  program: null,
  history: [],
  maxHistory: [],
  earnedBadges: [],
  onboarded: false,
  preferredSensorMode: 'tap',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function migrateAppData(raw: unknown): AppData {
  const source = isRecord(raw) && isRecord(raw.data) ? raw.data : raw
  const candidate = isRecord(source) ? source : {}
  const stats = isRecord(candidate.stats) ? candidate.stats : {}
  const preferredSensorMode = candidate.preferredSensorMode === 'accelerometer'
    ? 'tap'
    : candidate.preferredSensorMode

  return {
    ...candidate,
    schemaVersion: STORAGE_SCHEMA_VERSION,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : null,
    profile: isRecord(candidate.profile) ? candidate.profile as unknown as AppData['profile'] : null,
    stats: { ...DEFAULT_STATS, ...stats },
    program: isRecord(candidate.program) ? candidate.program as unknown as AppData['program'] : null,
    history: Array.isArray(candidate.history) ? candidate.history as unknown as AppData['history'] : [],
    maxHistory: Array.isArray(candidate.maxHistory) ? candidate.maxHistory as unknown as AppData['maxHistory'] : [],
    earnedBadges: Array.isArray(candidate.earnedBadges) ? candidate.earnedBadges as string[] : [],
    onboarded: candidate.onboarded === true,
    preferredSensorMode: 'tap',
  }
}

export function prepareAppDataForSave(data: AppData): AppData {
  return migrateAppData({
    ...data,
    schemaVersion: STORAGE_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  })
}

export function loadAppData(): AppData {
  if (typeof window === 'undefined') return DEFAULT_APP_DATA
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_APP_DATA
    return migrateAppData(JSON.parse(raw))
  } catch {
    return DEFAULT_APP_DATA
  }
}

export function saveAppData(data: AppData): void {
  if (typeof window === 'undefined') return
  try {
    const current = localStorage.getItem(STORAGE_KEY)
    if (current) localStorage.setItem(STORAGE_BACKUP_KEY, current)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prepareAppDataForSave(data)))
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

export function updateStats(
  data: AppData,
  sessionHistory: WorkoutHistory
): AppData {
  const stats = { ...data.stats }
  const today = new Date().toISOString()

  stats.totalPushups += sessionHistory.totalReps
  stats.totalSessions += 1
  stats.bestSession = Math.max(stats.bestSession, sessionHistory.totalReps)

  const bestSet = Math.max(...sessionHistory.sets.map(s => s.completedReps))
  stats.bestSingleSet = Math.max(stats.bestSingleSet, bestSet)

  // Streak calculation
  const lastDate = stats.lastSessionDate
  if (!lastDate) {
    stats.currentStreak = 1
  } else if (isConsecutiveDay(lastDate, today)) {
    stats.currentStreak += 1
  } else if (!isSameDay(lastDate, today)) {
    stats.currentStreak = 1
  }
  stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak)
  stats.lastSessionDate = today

  // Weekly pushups
  const startOfWeek = getStartOfWeek()
  const weeklyTotal = [...data.history, sessionHistory]
    .filter(h => new Date(h.date) >= startOfWeek)
    .reduce((sum, h) => sum + h.totalReps, 0)
  stats.weeklyPushups = weeklyTotal

  return { ...data, stats }
}

export function checkNewBadges(data: AppData): string[] {
  const earned = new Set(data.earnedBadges)
  const newBadges: string[] = []
  const stats = data.stats

  const check = (id: string, condition: boolean) => {
    if (condition && !earned.has(id)) newBadges.push(id)
  }

  check('first_session',  stats.totalSessions >= 1)
  check('streak_3',       stats.currentStreak >= 3)
  check('streak_7',       stats.currentStreak >= 7)
  check('streak_30',      stats.currentStreak >= 30)
  check('score_10',       (data.profile?.initialTestScore ?? 0) >= 10)
  check('score_25',       (data.profile?.initialTestScore ?? 0) >= 25)
  check('score_50',       (data.profile?.initialTestScore ?? 0) >= 50)
  check('total_100',      stats.totalPushups >= 100)
  check('total_1000',     stats.totalPushups >= 1_000)
  check('total_10000',    stats.totalPushups >= 10_000)
  check('session_10',     stats.totalSessions >= 10)
  check('goal_100',       stats.bestSingleSet >= 100)

  return newBadges
}

function isConsecutiveDay(date1: string, date2: string): boolean {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  d1.setHours(0, 0, 0, 0)
  d2.setHours(0, 0, 0, 0)
  const diff = (d2.getTime() - d1.getTime()) / 86_400_000
  return diff === 1
}

function isSameDay(date1: string, date2: string): boolean {
  return new Date(date1).toDateString() === new Date(date2).toDateString()
}

function getStartOfWeek(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}
