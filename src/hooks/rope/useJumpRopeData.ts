'use client'
import { useCallback } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { AppData } from '@/types'
import {
  JumpRopeProfile, JumpRopeSettings, JumpSession, JumpSessionMode, JumpSessionStatus, JumpSeries,
  JumpProgramId, JumpDraftSession, JumpJournalEntry, DailyChallengeSettings,
  DeviceConnectionState, HealthSyncState, LeaderboardConsent, RecordedClipMeta, JumpRopeData,
} from '@/types/rope'
import {
  DEFAULT_APP_DATA, STORAGE_KEY, STORAGE_BACKUP_KEY, LEGACY_STORAGE_KEYS,
  migrateAppData, prepareAppDataForSave,
} from '@/lib/storage'
import { generateId } from '@/lib/utils'
import { getJumpProgram } from '@/lib/rope/programs'
import { createProgramProgress, markWorkoutStatus } from '@/lib/rope/programProgress'
import { getChallenge7State, isChallenge7Complete } from '@/lib/rope/challenge'
import { checkNewJumpBadges } from '@/lib/rope/badges'
import { estimateCalories } from '@/lib/rope/config'
import { DEFAULT_JUMPROPE_DATA } from '@/lib/rope/defaults'

function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

/** Recalcule challenge7.completedDays/status depuis l'historique — jamais de compteur dupliqué. */
function syncChallenge7(jumprope: JumpRopeData): JumpRopeData {
  if (jumprope.challenge7.startDate === null) return jumprope
  const state = getChallenge7State(jumprope.sessions)
  const completedDays = state.filter(d => d.completed).map(d => d.day)
  const status = isChallenge7Complete(jumprope.sessions) ? 'completed' : 'active'
  return { ...jumprope, challenge7: { ...jumprope.challenge7, completedDays, status } }
}

export function useJumpRopeData() {
  const [data, setData, hydrated] = useLocalStorage<AppData>(STORAGE_KEY, DEFAULT_APP_DATA, {
    backupKey: STORAGE_BACKUP_KEY,
    fallbackKeys: LEGACY_STORAGE_KEYS,
    migrate: migrateAppData,
    prepareForSave: prepareAppDataForSave,
  })

  const setOnboarded = useCallback(() => {
    setData(prev => ({ ...prev, jumprope: { ...prev.jumprope, onboarded: true } }))
  }, [setData])

  const saveProfile = useCallback((profile: JumpRopeProfile) => {
    setData(prev => ({ ...prev, jumprope: { ...prev.jumprope, profile, onboarded: true } }))
  }, [setData])

  const updateSettings = useCallback((patch: Partial<JumpRopeSettings>) => {
    setData(prev => ({ ...prev, jumprope: { ...prev.jumprope, settings: { ...prev.jumprope.settings, ...patch } } }))
  }, [setData])

  const startProgram = useCallback((programId: JumpProgramId) => {
    setData(prev => ({
      ...prev,
      jumprope: {
        ...prev.jumprope,
        programProgress: { ...prev.jumprope.programProgress, [programId]: createProgramProgress(programId) },
        activeProgramId: programId,
      },
    }))
  }, [setData])

  const abandonProgram = useCallback((programId: JumpProgramId) => {
    setData(prev => {
      const progress = prev.jumprope.programProgress[programId]
      if (!progress) return prev
      return {
        ...prev,
        jumprope: {
          ...prev.jumprope,
          programProgress: { ...prev.jumprope.programProgress, [programId]: { ...progress, status: 'abandoned' } },
          activeProgramId: prev.jumprope.activeProgramId === programId ? null : prev.jumprope.activeProgramId,
        },
      }
    })
  }, [setData])

  const startChallenge7 = useCallback(() => {
    setData(prev => ({
      ...prev,
      jumprope: { ...prev.jumprope, challenge7: { startDate: new Date().toISOString(), completedDays: [], status: 'active' } },
    }))
  }, [setData])

  const updateDailyChallenge = useCallback((patch: Partial<DailyChallengeSettings>) => {
    setData(prev => ({ ...prev, jumprope: { ...prev.jumprope, dailyChallenge: { ...prev.jumprope.dailyChallenge, ...patch } } }))
  }, [setData])

  const saveDraftSession = useCallback((draft: JumpDraftSession | null) => {
    setData(prev => ({ ...prev, jumprope: { ...prev.jumprope, draftSession: draft } }))
  }, [setData])

  const recordSession = useCallback((input: {
    mode: JumpSessionMode
    startedAt: string
    totalDurationSeconds: number
    activeDurationSeconds: number
    totalJumps: number
    avgCadence: number
    maxCadence: number
    heartRateAvg?: number | null
    countingMethod: JumpSession['countingMethod']
    countingAlgorithmVersion: number
    series: JumpSeries[]
    bestStreak: number
    status: JumpSessionStatus
    programWorkoutIndex?: number | null
    challengeDay?: number | null
    virtual?: boolean
    clipId?: string | null
    notes?: string | null
  }) => {
    setData(prev => {
      const activeProgramId = input.mode === 'program' ? prev.jumprope.activeProgramId : null
      const caloriesEstimated = estimateCalories(input.activeDurationSeconds, input.avgCadence, prev.jumprope.profile?.weightKg ?? null)

      const record: JumpSession = {
        id: generateId(),
        mode: input.mode,
        date: input.startedAt,
        endDate: new Date().toISOString(),
        timezone: localTimezone(),
        totalDurationSeconds: input.totalDurationSeconds,
        activeDurationSeconds: input.activeDurationSeconds,
        totalJumps: input.totalJumps,
        avgCadence: input.avgCadence,
        maxCadence: input.maxCadence,
        caloriesEstimated,
        heartRateAvg: input.heartRateAvg ?? null,
        countingMethod: input.countingMethod,
        countingAlgorithmVersion: input.countingAlgorithmVersion,
        series: input.series,
        bestStreak: input.bestStreak,
        manualCorrection: false,
        notes: input.notes ?? null,
        journal: null,
        programId: activeProgramId,
        programWorkoutIndex: activeProgramId ? input.programWorkoutIndex ?? null : null,
        challengeId: input.mode === 'challenge7' ? 'challenge7' : null,
        challengeDay: input.mode === 'challenge7' ? input.challengeDay ?? null : null,
        status: input.status,
        clipId: input.clipId ?? null,
        virtual: input.virtual ?? false,
      }

      let programProgress = prev.jumprope.programProgress
      if (activeProgramId && input.programWorkoutIndex != null && input.status === 'completed') {
        const program = getJumpProgram(activeProgramId)
        const progress = programProgress[activeProgramId]
        if (progress) {
          programProgress = { ...programProgress, [activeProgramId]: markWorkoutStatus(program, progress, input.programWorkoutIndex, 'done') }
        }
      }

      let jumprope: JumpRopeData = {
        ...prev.jumprope,
        sessions: [record, ...prev.jumprope.sessions],
        programProgress,
        draftSession: null,
      }
      if (record.challengeId === 'challenge7') jumprope = syncChallenge7(jumprope)

      const newBadges = checkNewJumpBadges(jumprope)
      if (newBadges.length > 0) jumprope = { ...jumprope, earnedBadges: [...jumprope.earnedBadges, ...newBadges] }

      return { ...prev, jumprope }
    })
  }, [setData])

  /** Corrige manuellement le nombre de sauts d'une séance déjà enregistrée — jamais silencieux : la séance reste marquée `manualCorrection`. */
  const correctSessionJumps = useCallback((sessionId: string, newTotalJumps: number, note: string | null) => {
    setData(prev => {
      let jumprope: JumpRopeData = {
        ...prev.jumprope,
        sessions: prev.jumprope.sessions.map(s =>
          s.id === sessionId ? { ...s, totalJumps: newTotalJumps, manualCorrection: true, notes: note ?? s.notes } : s
        ),
      }
      jumprope = syncChallenge7(jumprope)
      const newBadges = checkNewJumpBadges(jumprope)
      if (newBadges.length > 0) jumprope = { ...jumprope, earnedBadges: [...jumprope.earnedBadges, ...newBadges] }
      return { ...prev, jumprope }
    })
  }, [setData])

  const updateSessionJournal = useCallback((sessionId: string, journal: JumpJournalEntry) => {
    setData(prev => ({
      ...prev,
      jumprope: { ...prev.jumprope, sessions: prev.jumprope.sessions.map(s => (s.id === sessionId ? { ...s, journal } : s)) },
    }))
  }, [setData])

  const deleteSession = useCallback((id: string) => {
    setData(prev => {
      const session = prev.jumprope.sessions.find(s => s.id === id)
      if (!session) return prev

      let programProgress = prev.jumprope.programProgress
      if (session.programId && session.programWorkoutIndex != null) {
        const programId = session.programId as JumpProgramId
        const progress = programProgress[programId]
        if (progress) {
          programProgress = {
            ...programProgress,
            [programId]: { ...progress, workoutStatus: { ...progress.workoutStatus, [session.programWorkoutIndex]: 'to_redo' } },
          }
        }
      }

      let jumprope: JumpRopeData = {
        ...prev.jumprope,
        sessions: prev.jumprope.sessions.filter(s => s.id !== id),
        programProgress,
      }
      if (session.challengeId === 'challenge7') jumprope = syncChallenge7(jumprope)

      return { ...prev, jumprope }
    })
  }, [setData])

  const updateDeviceConnection = useCallback((type: DeviceConnectionState['type'], patch: Partial<DeviceConnectionState>) => {
    setData(prev => ({
      ...prev,
      jumprope: {
        ...prev.jumprope,
        deviceConnections: prev.jumprope.deviceConnections.map(d => (d.type === type ? { ...d, ...patch } : d)),
      },
    }))
  }, [setData])

  const updateHealthSync = useCallback((patch: Partial<HealthSyncState>) => {
    setData(prev => ({ ...prev, jumprope: { ...prev.jumprope, healthSync: { ...prev.jumprope.healthSync, ...patch } } }))
  }, [setData])

  const updateLeaderboardConsent = useCallback((patch: Partial<LeaderboardConsent>) => {
    setData(prev => ({ ...prev, jumprope: { ...prev.jumprope, leaderboard: { ...prev.jumprope.leaderboard, ...patch } } }))
  }, [setData])

  const addClip = useCallback((clip: RecordedClipMeta) => {
    setData(prev => ({ ...prev, jumprope: { ...prev.jumprope, clips: [clip, ...prev.jumprope.clips] } }))
  }, [setData])

  const renameClip = useCallback((id: string, name: string) => {
    setData(prev => ({
      ...prev,
      jumprope: { ...prev.jumprope, clips: prev.jumprope.clips.map(c => (c.id === id ? { ...c, name } : c)) },
    }))
  }, [setData])

  const deleteClip = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      jumprope: {
        ...prev.jumprope,
        clips: prev.jumprope.clips.filter(c => c.id !== id),
        sessions: prev.jumprope.sessions.map(s => (s.clipId === id ? { ...s, clipId: null } : s)),
      },
    }))
  }, [setData])

  /** Réinitialise entièrement les données Corde à sauter (profil, séances, badges, programmes...), sans toucher Pompes/Gainage. */
  const resetData = useCallback(() => {
    setData(prev => ({ ...prev, jumprope: DEFAULT_JUMPROPE_DATA }))
  }, [setData])

  return {
    data,
    hydrated,
    jumprope: data.jumprope,
    setOnboarded,
    saveProfile,
    updateSettings,
    startProgram,
    abandonProgram,
    startChallenge7,
    updateDailyChallenge,
    saveDraftSession,
    recordSession,
    correctSessionJumps,
    updateSessionJournal,
    deleteSession,
    updateDeviceConnection,
    updateHealthSync,
    updateLeaderboardConsent,
    addClip,
    renameClip,
    deleteClip,
    resetData,
  }
}
