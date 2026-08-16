import { Level, ProgramSession, ProgramSet, WorkoutProgram } from '@/types'
import { getLevelFromScore } from './utils'

interface LevelConfig {
  setsPerSession: number
  restSeconds: number
  weeklyGrowthRate: number
  startFactor: number
}

const LEVEL_CONFIG: Record<Level, LevelConfig> = {
  beginner:     { setsPerSession: 5, restSeconds: 90, weeklyGrowthRate: 0.13, startFactor: 0.35 },
  intermediate: { setsPerSession: 5, restSeconds: 75, weeklyGrowthRate: 0.15, startFactor: 0.40 },
  advanced:     { setsPerSession: 5, restSeconds: 60, weeklyGrowthRate: 0.17, startFactor: 0.45 },
  elite:        { setsPerSession: 6, restSeconds: 45, weeklyGrowthRate: 0.12, startFactor: 0.55 },
}

const SESSION_FOCUSES = ['Volume', 'Puissance', 'Endurance']

/**
 * Estimate the number of weeks needed to go from initialScore to goal.
 * The last set of each session is at baseReps * weekMultiplier * 1.1.
 * We solve for the week where that equals goal.
 */
export function estimateProgramDuration(
  initialScore: number,
  goal: number
): { weeks: number; sessions: number } {
  const level = getLevelFromScore(initialScore)
  const cfg   = LEVEL_CONFIG[level]
  const baseReps = Math.max(2, Math.round(initialScore * cfg.startFactor))

  // Last set = baseReps * weekMultiplier * 1.1 = goal
  // weekMultiplier = goal / (baseReps * 1.1)
  // 1 + (week - 1) * rate = multiplier  →  week = 1 + (multiplier - 1) / rate
  const multiplierNeeded = goal / (baseReps * 1.1)
  const weeksNeeded = multiplierNeeded <= 1
    ? 4
    : Math.ceil(1 + (multiplierNeeded - 1) / cfg.weeklyGrowthRate)

  const weeks = Math.min(Math.max(weeksNeeded, 4), 52)
  return { weeks, sessions: weeks * 3 }
}

function buildSets(targetReps: number, totalSets: number, restSeconds: number): ProgramSet[] {
  return Array.from({ length: totalSets }, (_, i) => {
    const isLast = i === totalSets - 1
    let reps = targetReps
    if (i === 0)  reps = Math.max(1, Math.round(targetReps * 0.9))
    if (isLast)   reps = Math.round(targetReps * 1.1)
    return { reps, restSeconds: isLast ? 0 : restSeconds }
  })
}

export function generateProgram(initialScore: number, goal = 100): WorkoutProgram {
  const level = getLevelFromScore(initialScore)
  const cfg   = LEVEL_CONFIG[level]
  const baseReps = Math.max(2, Math.round(initialScore * cfg.startFactor))

  const { sessions: sessionCount } = estimateProgramDuration(initialScore, goal)

  const sessions: ProgramSession[] = Array.from({ length: sessionCount }, (_, i) => {
    const week = Math.floor(i / 3) + 1
    const day  = (i % 3) + 1
    const weekMultiplier = 1 + (week - 1) * cfg.weeklyGrowthRate
    const targetReps = Math.round(baseReps * weekMultiplier)
    const sets = buildSets(targetReps, cfg.setsPerSession, cfg.restSeconds)
    const totalTarget = sets.reduce((s, r) => s + r.reps, 0)

    return {
      index: i,
      day,
      week,
      sets,
      totalTarget,
      focus: SESSION_FOCUSES[i % SESSION_FOCUSES.length],
    }
  })

  return {
    level,
    initialScore,
    goal,
    sessions,
    currentSessionIndex: 0,
    startDate: new Date().toISOString(),
  }
}

export function getNextSession(program: WorkoutProgram): ProgramSession | null {
  const idx = program.currentSessionIndex
  return idx < program.sessions.length ? program.sessions[idx] : null
}

export function getProgressPercent(program: WorkoutProgram): number {
  if (program.sessions.length === 0) return 0
  return Math.round((program.currentSessionIndex / program.sessions.length) * 100)
}

export function estimateWeeksLeft(program: WorkoutProgram): number {
  const remaining = program.sessions.length - program.currentSessionIndex
  return Math.ceil(remaining / 3)
}

export const ALL_BADGES = [
  { id: 'first_session', name: 'Premier pas',    icon: '🏁', description: 'Terminer votre première séance' },

  // Streak — jours consécutifs
  { id: 'streak_3',      name: 'Trio',              icon: '🔥', description: '3 jours de streak' },
  { id: 'streak_7',      name: 'Semaine de feu',    icon: '⚡', description: '7 jours de streak' },
  { id: 'streak_14',     name: 'Deux semaines',     icon: '🌟', description: '14 jours de streak' },
  { id: 'streak_30',     name: 'Invaincu',          icon: '👑', description: '30 jours de streak' },
  { id: 'streak_60',     name: 'Inarrêtable',       icon: '🚀', description: '60 jours de streak' },
  { id: 'streak_100',    name: 'Centurion',         icon: '🏛️', description: '100 jours de streak' },
  { id: 'streak_365',    name: 'Légende vivante',   icon: '🌠', description: '365 jours de streak' },

  // Score au test initial
  { id: 'score_5',       name: 'Premiers pas',      icon: '🌱', description: 'Test initial ≥ 5 pompes' },
  { id: 'score_10',      name: "10 d'affilée",      icon: '💪', description: 'Test initial ≥ 10 pompes' },
  { id: 'score_15',      name: 'En forme',          icon: '🔥', description: 'Test initial ≥ 15 pompes' },
  { id: 'score_25',      name: 'Intermédiaire',     icon: '⭐', description: 'Test initial ≥ 25 pompes' },
  { id: 'score_35',      name: 'Solide',            icon: '🛡️', description: 'Test initial ≥ 35 pompes' },
  { id: 'score_50',      name: 'Avancé',            icon: '🌟', description: 'Test initial ≥ 50 pompes' },
  { id: 'score_75',      name: 'Athlète',           icon: '🏅', description: 'Test initial ≥ 75 pompes' },
  { id: 'score_100',     name: 'Machine',           icon: '🦾', description: 'Test initial ≥ 100 pompes' },

  // Total cumulé de pompes (programme + séances libres)
  { id: 'total_50',      name: 'Échauffement',      icon: '🔸', description: '50 pompes au total' },
  { id: 'total_100',     name: 'Centenaire',        icon: '💯', description: '100 pompes au total' },
  { id: 'total_500',     name: 'Endurant',          icon: '🔋', description: '500 pompes au total' },
  { id: 'total_1000',    name: 'Kilo Club',         icon: '🏋️', description: '1 000 pompes au total' },
  { id: 'total_2500',    name: 'Increvable',        icon: '⚙️', description: '2 500 pompes au total' },
  { id: 'total_5000',    name: 'Machine de guerre', icon: '🛠️', description: '5 000 pompes au total' },
  { id: 'total_10000',   name: 'Légendaire',        icon: '🦁', description: '10 000 pompes au total' },
  { id: 'total_25000',   name: 'Titan',             icon: '🗿', description: '25 000 pompes au total' },
  { id: 'total_50000',   name: 'Mythique',          icon: '🐉', description: '50 000 pompes au total' },
  { id: 'total_100000',  name: 'Immortel',          icon: '♾️', description: '100 000 pompes au total' },

  // Nombre de séances terminées (programme + libre)
  { id: 'session_5',     name: 'Habitude',          icon: '📆', description: '5 séances complètes' },
  { id: 'session_10',    name: 'Habitué',           icon: '📅', description: '10 séances complètes' },
  { id: 'session_25',    name: 'Assidu',            icon: '🗓️', description: '25 séances complètes' },
  { id: 'session_50',    name: 'Discipliné',        icon: '📈', description: '50 séances complètes' },
  { id: 'session_100',   name: 'Vétéran',           icon: '🎖️', description: '100 séances complètes' },
  { id: 'session_250',   name: 'Pilier',            icon: '🏛️', description: '250 séances complètes' },
  { id: 'session_500',   name: 'Icône',             icon: '🏆', description: '500 séances complètes' },

  // Meilleure série unique (tous modes confondus)
  { id: 'best_set_10',   name: 'Dix d\'un coup',    icon: '🔟', description: 'Meilleure série ≥ 10 pompes' },
  { id: 'best_set_25',   name: 'Quart de cent',     icon: '🎯', description: 'Meilleure série ≥ 25 pompes' },
  { id: 'best_set_50',   name: 'Bourreau de travail', icon: '🔨', description: 'Meilleure série ≥ 50 pompes' },
  { id: 'best_set_75',   name: 'Presque centenaire', icon: '🎖', description: 'Meilleure série ≥ 75 pompes' },
  { id: 'goal_100',      name: 'Objectif !',        icon: '🎯', description: 'Meilleure série ≥ 100 pompes' },
  { id: 'best_set_150',  name: 'Surhomme',          icon: '🦸', description: 'Meilleure série ≥ 150 pompes' },
  { id: 'best_set_200',  name: 'Surhumain',         icon: '🌪️', description: 'Meilleure série ≥ 200 pompes' },
]
