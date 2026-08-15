import {
  PlankProgram,
  PlankProgramSession,
  PlankProgramSet,
  PlankDifficultyFeedback,
} from '@/types/plank'
import {
  DEFAULT_REST_SECONDS,
  DURATION_ROUNDING_STEP,
  MIN_SET_SECONDS,
  PROGRAM_GENERATOR_VERSION,
  PROGRAM_SESSIONS_PER_WEEK,
  PROGRAM_TOTAL_SESSIONS,
  FEEDBACK_EASY_INCREMENT_SECONDS,
  FEEDBACK_HARD_DECREMENT_SECONDS,
  FEEDBACK_MAX_CUMULATIVE_SHIFT_SECONDS,
} from './config'

const SETS_PER_WEEK = [5, 4, 3, 2] // décroît : on tend vers le maintien continu

export function round5(seconds: number): number {
  return Math.max(MIN_SET_SECONDS, Math.round(seconds / DURATION_ROUNDING_STEP) * DURATION_ROUNDING_STEP)
}

function buildSessionSets(
  targetSeconds: number,
  totalSets: number,
  restSeconds: number,
  capSeconds: number
): PlankProgramSet[] {
  return Array.from({ length: totalSets }, (_, i) => {
    const isLast = i === totalSets - 1
    let seconds = targetSeconds
    if (totalSets > 1 && i === 0) seconds = targetSeconds * 0.85 // série courte d'entrée
    if (totalSets > 1 && isLast) seconds = targetSeconds * 1.15  // série longue, quasi continue
    return { targetSeconds: Math.min(round5(seconds), capSeconds), restSeconds: isLast ? 0 : restSeconds }
  })
}

interface GenerateOptions {
  restSeconds?: number
}

/**
 * Génère un programme déterministe de PROGRAM_TOTAL_SESSIONS séances à partir
 * du résultat au test initial et de l'objectif choisi. Pure fonction :
 * (initialSeconds, goalSeconds) déterminent entièrement le résultat.
 *
 * - Si initialSeconds >= goalSeconds : programme d'entretien au niveau de
 *   l'objectif (pas de fausse progression).
 * - Sinon : progression non linéaire, séries qui diminuent en nombre mais
 *   augmentent en durée au fil des semaines, dernière séance = tentative
 *   unique de l'objectif.
 */
export function generatePlankProgram(
  initialSeconds: number,
  goalSeconds: number,
  options: GenerateOptions = {}
): PlankProgram {
  const restSeconds = options.restSeconds ?? DEFAULT_REST_SECONDS
  const isMaintenance = initialSeconds >= goalSeconds
  const trainingSessionCount = PROGRAM_TOTAL_SESSIONS - 1 // la dernière = tentative de l'objectif

  const sessions: PlankProgramSession[] = []

  for (let i = 0; i < trainingSessionCount; i++) {
    const week = Math.floor(i / PROGRAM_SESSIONS_PER_WEEK) + 1
    const day = (i % PROGRAM_SESSIONS_PER_WEEK) + 1
    const weekIndex = Math.min(week - 1, SETS_PER_WEEK.length - 1)
    const setsCount = SETS_PER_WEEK[weekIndex]

    let targetSeconds: number
    if (isMaintenance) {
      targetSeconds = round5(goalSeconds * 0.85)
    } else {
      const baseSeconds = round5(Math.max(MIN_SET_SECONDS, Math.min(initialSeconds * 0.5, goalSeconds - DURATION_ROUNDING_STEP)))
      const progressFrac = trainingSessionCount <= 1 ? 1 : i / (trainingSessionCount - 1)
      const raw = baseSeconds + (goalSeconds * 0.9 - baseSeconds) * progressFrac
      targetSeconds = round5(Math.min(raw, goalSeconds * 0.95))
    }

    sessions.push({
      index: i,
      week,
      day,
      sets: buildSessionSets(targetSeconds, setsCount, restSeconds, goalSeconds),
      isGoalAttempt: false,
      status: 'pending',
    })
  }

  // Garantit une progression non décroissante (pas de saut brutal en arrière).
  for (let i = 1; i < sessions.length; i++) {
    const prevMax = Math.max(...sessions[i - 1].sets.map(s => s.targetSeconds))
    const curMax = Math.max(...sessions[i].sets.map(s => s.targetSeconds))
    if (curMax < prevMax) {
      sessions[i] = { ...sessions[i], sets: sessions[i].sets.map(s => ({ ...s, targetSeconds: Math.max(s.targetSeconds, prevMax) })) }
    }
  }

  const lastWeek = Math.floor(trainingSessionCount / PROGRAM_SESSIONS_PER_WEEK) + 1
  const lastDay = (trainingSessionCount % PROGRAM_SESSIONS_PER_WEEK) + 1
  sessions.push({
    index: trainingSessionCount,
    week: lastWeek,
    day: lastDay,
    sets: [{ targetSeconds: goalSeconds, restSeconds: 0 }],
    isGoalAttempt: true,
    status: 'pending',
  })

  return {
    id: generateProgramId(),
    generatorVersion: PROGRAM_GENERATOR_VERSION,
    goalSeconds,
    initialSeconds,
    startDate: new Date().toISOString(),
    status: 'active',
    currentSessionIndex: 0,
    sessions,
    adaptations: [],
  }
}

function generateProgramId(): string {
  return `plankprog_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function getNextPlankProgramSession(program: PlankProgram): PlankProgramSession | null {
  return program.sessions.find(s => s.status === 'pending') ?? null
}

export function getPlankProgramProgress(program: PlankProgram): number {
  if (program.sessions.length === 0) return 0
  const done = program.sessions.filter(s => s.status === 'done').length
  return Math.round((done / program.sessions.length) * 100)
}

/**
 * Applique un feedback de difficulté aux séances futures (statut 'pending')
 * uniquement. Ajustement borné, déterministe, jamais rétroactif : ne touche
 * ni les séances déjà faites ni l'historique.
 */
export function applyPlankFeedback(
  program: PlankProgram,
  sessionIndex: number,
  feedback: PlankDifficultyFeedback
): PlankProgram {
  if (feedback === 'ok') return program

  const cumulativeShift = program.adaptations.reduce((sum, a) => sum + a.adjustmentSeconds, 0)
  const delta = feedback === 'easy' ? FEEDBACK_EASY_INCREMENT_SECONDS : -FEEDBACK_HARD_DECREMENT_SECONDS
  const nextCumulative = cumulativeShift + delta
  const clampedCumulative = Math.max(
    -FEEDBACK_MAX_CUMULATIVE_SHIFT_SECONDS,
    Math.min(FEEDBACK_MAX_CUMULATIVE_SHIFT_SECONDS, nextCumulative)
  )
  const appliedDelta = clampedCumulative - cumulativeShift
  if (appliedDelta === 0) return program

  const sessions = program.sessions.map(s => {
    if (s.status !== 'pending' || s.index <= sessionIndex || s.isGoalAttempt) return s
    return {
      ...s,
      sets: s.sets.map(set => ({
        ...set,
        targetSeconds: round5(
          Math.min(program.goalSeconds, Math.max(MIN_SET_SECONDS, set.targetSeconds + appliedDelta))
        ),
      })),
    }
  })

  return {
    ...program,
    sessions,
    adaptations: [
      ...program.adaptations,
      { sessionIndex, feedback, adjustmentSeconds: appliedDelta, appliedAt: new Date().toISOString() },
    ],
  }
}
