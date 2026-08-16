'use client'
import { useCallback, useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { AppData } from '@/types'
import {
  updateStats,
  checkNewBadges,
  DEFAULT_APP_DATA,
  STORAGE_BACKUP_KEY,
  STORAGE_KEY,
  LEGACY_STORAGE_KEYS,
  migrateAppData,
  prepareAppDataForSave,
} from '@/lib/storage'
import { generateProgram } from '@/lib/programGenerator'
import { generateId } from '@/lib/utils'
import type { WorkoutHistory, CompletedSet, MaxPerformanceRecord, SensorMode, PompesFreeSession, PompesFreeMode, PompesFreeSet } from '@/types'
import type { PlankSettings } from '@/types/plank'

interface ProfileOptions {
  avatarColor?: string
  avatarImage?: string | null
}

export function useAppData() {
  const [data, setData, hydrated] = useLocalStorage<AppData>(STORAGE_KEY, DEFAULT_APP_DATA, {
    backupKey: STORAGE_BACKUP_KEY,
    fallbackKeys: LEGACY_STORAGE_KEYS,
    migrate: migrateAppData,
    prepareForSave: prepareAppDataForSave,
  })

  useEffect(() => {
    // Coerce any legacy non-tap sensor mode to tap (only mode supported)
    if (hydrated && (data.preferredSensorMode as string) !== 'tap') {
      setData(prev => ({ ...prev, preferredSensorMode: 'tap' }))
    }
  }, [data.preferredSensorMode, hydrated, setData])

  const completeSession = useCallback((
    sets: CompletedSet[],
    sessionIndex: number,
    duration: number
  ) => {
    setData(prev => {
      if (!prev.program || !prev.profile) return prev

      const session = prev.program.sessions[sessionIndex]
      if (!session) return prev

      const totalReps = sets.reduce((s, r) => s + r.completedReps, 0)
      const targetReps = session.totalTarget

      const history: WorkoutHistory = {
        id: generateId(),
        date: new Date().toISOString(),
        sessionIndex,
        week: session.week,
        day: session.day,
        sets,
        totalReps,
        targetReps,
        completed: totalReps >= Math.round(targetReps * 0.8),
        duration,
      }

      const nextIndex = Math.min(sessionIndex + 1, prev.program.sessions.length)
      const updatedProgram = { ...prev.program, currentSessionIndex: nextIndex }

      let updated: AppData = {
        ...prev,
        program: updatedProgram,
        history: [history, ...prev.history],
      }
      updated = updateStats(updated, history)

      const newBadges = checkNewBadges(updated)
      if (newBadges.length > 0) {
        updated = { ...updated, earnedBadges: [...updated.earnedBadges, ...newBadges] }
      }

      return updated
    })
  }, [setData])

  const startProgram = useCallback((score: number, goal = 100) => {
    setData(prev => {
      const program = generateProgram(score, goal)
      return { ...prev, program }
    })
  }, [setData])

  const setProfile = useCallback((name: string, score: number, options: ProfileOptions = {}) => {
    setData(prev => {
      const colors = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#f43f5e']
      const profile = {
        id: generateId(),
        name,
        initialTestScore: score,
        level: prev.program?.level ?? 'beginner' as const,
        createdAt: new Date().toISOString(),
        avatarColor: options.avatarColor ?? colors[Math.floor(Math.random() * colors.length)],
        avatarImage: options.avatarImage ?? null,
      }
      return { ...prev, profile, onboarded: true }
    })
  }, [setData])

  const setSensorMode = useCallback((mode: AppData['preferredSensorMode']) => {
    setData(prev => ({ ...prev, preferredSensorMode: mode }))
  }, [setData])

  const saveMaxPerformance = useCallback((
    reps: number,
    duration: number,
    sensorMode: SensorMode
  ) => {
    setData(prev => {
      const record: MaxPerformanceRecord = {
        id: generateId(),
        date: new Date().toISOString(),
        reps,
        duration,
        sensorMode,
      }
      const maxHistory = [record, ...(prev.maxHistory ?? [])]

      // Update bestSingleSet in stats if new record
      const stats = reps > prev.stats.bestSingleSet
        ? { ...prev.stats, bestSingleSet: reps }
        : prev.stats

      // Check new badges
      let updated = { ...prev, maxHistory, stats }
      const newBadges = checkNewBadges(updated)
      if (newBadges.length > 0) {
        updated = { ...updated, earnedBadges: [...updated.earnedBadges, ...newBadges] }
      }
      return updated
    })
  }, [setData])

  const saveFreeSession = useCallback((input: {
    mode: PompesFreeMode
    restSeconds: number
    sets: PompesFreeSet[]
    status: PompesFreeSession['status']
  }) => {
    setData(prev => {
      const totalReps = input.sets.filter(s => s.status === 'completed').reduce((s, x) => s + x.actualReps, 0)
      const actualDurationSeconds = input.sets.reduce((s, x) => s + x.actualDurationSeconds, 0)
      const record: PompesFreeSession = {
        id: generateId(),
        date: new Date().toISOString(),
        mode: input.mode,
        plannedSetCount: input.sets.length,
        restSeconds: input.restSeconds,
        sets: input.sets,
        totalReps,
        actualDurationSeconds,
        status: input.status,
      }

      const bestSet = input.sets.reduce((max, s) => Math.max(max, s.actualReps), 0)
      const stats = {
        ...prev.stats,
        totalPushups: prev.stats.totalPushups + totalReps,
        bestSingleSet: Math.max(prev.stats.bestSingleSet, bestSet),
      }

      let updated = { ...prev, pompesFreeHistory: [record, ...prev.pompesFreeHistory], stats }
      const newBadges = checkNewBadges(updated)
      if (newBadges.length > 0) {
        updated = { ...updated, earnedBadges: [...updated.earnedBadges, ...newBadges] }
      }
      return updated
    })
  }, [setData])

  const updatePompesAudioSettings = useCallback((patch: Partial<PlankSettings>) => {
    setData(prev => ({ ...prev, pompesAudioSettings: { ...prev.pompesAudioSettings, ...patch } }))
  }, [setData])

  const updateAvatarImage = useCallback((avatarImage: string | null) => {
    setData(prev => {
      if (!prev.profile) return prev
      return { ...prev, profile: { ...prev.profile, avatarImage } }
    })
  }, [setData])

  const resetApp = useCallback(() => {
    setData(DEFAULT_APP_DATA)
  }, [setData])

  return {
    data,
    hydrated,
    completeSession,
    saveMaxPerformance,
    saveFreeSession,
    updatePompesAudioSettings,
    startProgram,
    setProfile,
    setSensorMode,
    updateAvatarImage,
    resetApp,
  }
}
