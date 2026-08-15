'use client'
import { useCallback } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { AppData } from '@/types'
import {
  PlankProgram,
  PlankSession,
  PlankSet,
  PlankSessionMode,
  PlankDifficultyFeedback,
  PlankDraftSession,
} from '@/types/plank'
import {
  DEFAULT_APP_DATA,
  STORAGE_KEY,
  STORAGE_BACKUP_KEY,
  LEGACY_STORAGE_KEYS,
  migrateAppData,
  prepareAppDataForSave,
} from '@/lib/storage'
import { generatePlankProgram, applyPlankFeedback } from '@/lib/plank/programGenerator'
import { checkNewPlankBadges } from '@/lib/plank/badges'
import { generateId } from '@/lib/utils'
import { DEFAULT_PLANK_SETTINGS } from '@/lib/plank/config'
import type { PlankSettings } from '@/types/plank'

export function usePlankData() {
  const [data, setData, hydrated] = useLocalStorage<AppData>(STORAGE_KEY, DEFAULT_APP_DATA, {
    backupKey: STORAGE_BACKUP_KEY,
    fallbackKeys: LEGACY_STORAGE_KEYS,
    migrate: migrateAppData,
    prepareForSave: prepareAppDataForSave,
  })

  const setOnboarded = useCallback(() => {
    setData(prev => ({ ...prev, gainage: { ...prev.gainage, onboarded: true } }))
  }, [setData])

  const updateSettings = useCallback((patch: Partial<PlankSettings>) => {
    setData(prev => ({
      ...prev,
      gainage: { ...prev.gainage, settings: { ...prev.gainage.settings, ...patch } },
    }))
  }, [setData])

  const recordTest = useCallback((durationSeconds: number) => {
    setData(prev => ({
      ...prev,
      gainage: {
        ...prev.gainage,
        tests: [{ id: generateId(), date: new Date().toISOString(), durationSeconds }, ...prev.gainage.tests],
      },
    }))
  }, [setData])

  const startProgram = useCallback((goalSeconds: number, initialSeconds: number, restSeconds?: number) => {
    setData(prev => {
      const program = generatePlankProgram(initialSeconds, goalSeconds, {
        restSeconds: restSeconds ?? prev.gainage.settings.restSeconds,
      })
      const previousPrograms = prev.gainage.programs.map(p =>
        p.id === prev.gainage.activeProgramId && p.status === 'active' ? { ...p, status: 'abandoned' as const } : p
      )
      return {
        ...prev,
        gainage: {
          ...prev.gainage,
          programs: [...previousPrograms, program],
          activeProgramId: program.id,
        },
      }
    })
  }, [setData])

  /** Adapte le programme actif au nouvel objectif : conserve les séances déjà faites, régénère celles à venir. */
  const adaptActiveProgramGoal = useCallback((newGoalSeconds: number) => {
    setData(prev => {
      const active = prev.gainage.programs.find(p => p.id === prev.gainage.activeProgramId)
      if (!active) return prev
      const regenerated = generatePlankProgram(active.initialSeconds, newGoalSeconds, {
        restSeconds: prev.gainage.settings.restSeconds,
      })
      const mergedSessions = active.sessions.map((s, i) =>
        s.status === 'done' ? s : { ...regenerated.sessions[i], index: i }
      )
      const updated: PlankProgram = { ...active, goalSeconds: newGoalSeconds, sessions: mergedSessions }
      return {
        ...prev,
        gainage: {
          ...prev.gainage,
          programs: prev.gainage.programs.map(p => (p.id === active.id ? updated : p)),
        },
      }
    })
  }, [setData])

  const recordProgramSessionFeedback = useCallback((sessionIndex: number, feedback: PlankDifficultyFeedback) => {
    setData(prev => {
      const active = prev.gainage.programs.find(p => p.id === prev.gainage.activeProgramId)
      if (!active) return prev
      const updated = applyPlankFeedback(active, sessionIndex, feedback)
      return {
        ...prev,
        gainage: { ...prev.gainage, programs: prev.gainage.programs.map(p => (p.id === active.id ? updated : p)) },
      }
    })
  }, [setData])

  const saveDraftSession = useCallback((draft: PlankDraftSession | null) => {
    setData(prev => ({ ...prev, gainage: { ...prev.gainage, draftSession: draft } }))
  }, [setData])

  const recordSession = useCallback((input: {
    mode: PlankSessionMode
    plannedDurationSeconds: number
    actualDurationSeconds: number
    plannedSetCount: number
    sets: PlankSet[]
    restSeconds: number
    status: PlankSession['status']
    difficultyFeedback?: PlankDifficultyFeedback | null
    programSessionIndex?: number | null
  }) => {
    setData(prev => {
      const totalHoldSeconds = input.sets.reduce((sum, s) => sum + (s.status === 'completed' ? s.actualSeconds : 0), 0)
      const active = prev.gainage.programs.find(p => p.id === prev.gainage.activeProgramId)
      const isProgramSession = input.mode === 'program' && active != null && input.programSessionIndex != null

      const record: PlankSession = {
        id: generateId(),
        mode: input.mode,
        date: new Date().toISOString(),
        plannedDurationSeconds: input.plannedDurationSeconds,
        actualDurationSeconds: input.actualDurationSeconds,
        totalHoldSeconds,
        plannedSetCount: input.plannedSetCount,
        sets: input.sets,
        restSeconds: input.restSeconds,
        status: input.status,
        difficultyFeedback: input.difficultyFeedback ?? null,
        programId: isProgramSession ? active!.id : null,
        programSessionIndex: isProgramSession ? input.programSessionIndex! : null,
      }

      let programs = prev.gainage.programs
      let goalReached = false

      if (isProgramSession && active) {
        const planSession = active.sessions[input.programSessionIndex!]
        const sessionCompleted = input.status === 'completed'
        if (planSession?.isGoalAttempt && sessionCompleted && totalHoldSeconds >= active.goalSeconds) {
          goalReached = true
        }
        const sessions = active.sessions.map((s, i) => {
          if (i !== input.programSessionIndex) return s
          return { ...s, status: sessionCompleted ? ('done' as const) : ('to_redo' as const) }
        })
        const nextIndex = sessionCompleted
          ? Math.min(active.currentSessionIndex + 1, active.sessions.length)
          : active.currentSessionIndex
        const updatedProgram: PlankProgram = {
          ...active,
          sessions,
          currentSessionIndex: nextIndex,
          status: goalReached ? 'completed' : active.status,
        }
        programs = prev.gainage.programs.map(p => (p.id === active.id ? updatedProgram : p))
      }

      const gainageAfterSession = {
        ...prev.gainage,
        sessions: [record, ...prev.gainage.sessions],
        programs,
        draftSession: null,
      }

      const newBadges = checkNewPlankBadges(gainageAfterSession, goalReached)
      const gainage = newBadges.length > 0
        ? { ...gainageAfterSession, earnedBadges: [...gainageAfterSession.earnedBadges, ...newBadges] }
        : gainageAfterSession

      return { ...prev, gainage }
    })
  }, [setData])

  const deleteSession = useCallback((id: string) => {
    setData(prev => {
      const session = prev.gainage.sessions.find(s => s.id === id)
      if (!session) return prev

      let programs = prev.gainage.programs
      if (session.programId != null && session.programSessionIndex != null) {
        programs = prev.gainage.programs.map(p => {
          if (p.id !== session.programId) return p
          return {
            ...p,
            sessions: p.sessions.map((s, i) => (i === session.programSessionIndex ? { ...s, status: 'to_redo' as const } : s)),
          }
        })
      }

      return {
        ...prev,
        gainage: {
          ...prev.gainage,
          sessions: prev.gainage.sessions.filter(s => s.id !== id),
          programs,
        },
      }
    })
  }, [setData])

  return {
    data,
    hydrated,
    gainage: data.gainage,
    setOnboarded,
    updateSettings,
    recordTest,
    startProgram,
    adaptActiveProgramGoal,
    recordProgramSessionFeedback,
    recordSession,
    deleteSession,
    saveDraftSession,
  }
}

export { DEFAULT_PLANK_SETTINGS }
