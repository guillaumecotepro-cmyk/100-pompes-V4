'use client'
import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { AppData } from '@/types'
import { updateStats, checkNewBadges, DEFAULT_APP_DATA } from '@/lib/storage'
import { generateProgram } from '@/lib/programGenerator'
import { generateId } from '@/lib/utils'
import type { WorkoutHistory, CompletedSet, MaxPerformanceRecord, SensorMode } from '@/types'

export function useAppData() {
  const [data, setData, hydrated] = useLocalStorage<AppData>('100pompes_v1', DEFAULT_APP_DATA)

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

  const setProfile = useCallback((name: string, score: number) => {
    setData(prev => {
      const colors = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#f43f5e']
      const profile = {
        id: generateId(),
        name,
        initialTestScore: score,
        level: prev.program?.level ?? 'beginner' as const,
        createdAt: new Date().toISOString(),
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
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

  const resetApp = useCallback(() => {
    setData(DEFAULT_APP_DATA)
  }, [setData])

  return {
    data,
    hydrated,
    completeSession,
    saveMaxPerformance,
    startProgram,
    setProfile,
    setSensorMode,
    resetApp,
  }
}
