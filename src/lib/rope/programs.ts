import { JumpProgramBlock, JumpProgramDef, JumpProgramId, JumpProgramWorkout } from '@/types/rope'
import { estimateCalories } from './config'

function block(type: JumpProgramBlock['type'], durationSeconds: number, label: string, targetJumps: number | null = null): JumpProgramBlock {
  return { type, durationSeconds, targetJumps, label }
}

/** Séance intervalle classique : échauffement, N rounds travail/repos, récupération finale. */
function buildIntervalWorkout(
  index: number, week: number, day: number, title: string,
  workSeconds: number, restSeconds: number, rounds: number,
  warmupSeconds: number, cooldownSeconds: number, assumedCadence: number
): JumpProgramWorkout {
  const blocks: JumpProgramBlock[] = []
  if (warmupSeconds > 0) blocks.push(block('warmup', warmupSeconds, 'Échauffement'))
  for (let r = 0; r < rounds; r++) {
    blocks.push(block('work', workSeconds, `Travail ${r + 1}/${rounds}`))
    if (r < rounds - 1) blocks.push(block('rest', restSeconds, 'Repos'))
  }
  if (cooldownSeconds > 0) blocks.push(block('cooldown', cooldownSeconds, 'Récupération finale'))

  const totalActiveSeconds = workSeconds * rounds
  return {
    index, week, day, title, blocks,
    estimatedCalories: estimateCalories(totalActiveSeconds, assumedCadence, 70),
  }
}

/** Séance pyramide : durées de travail croissantes puis décroissantes, repos fixe. */
function buildPyramidWorkout(
  index: number, week: number, day: number, title: string,
  steps: number[], restSeconds: number, warmupSeconds: number, cooldownSeconds: number, assumedCadence: number
): JumpProgramWorkout {
  const sequence = [...steps, ...[...steps].reverse().slice(1)]
  const blocks: JumpProgramBlock[] = []
  if (warmupSeconds > 0) blocks.push(block('warmup', warmupSeconds, 'Échauffement'))
  sequence.forEach((workSeconds, i) => {
    blocks.push(block('work', workSeconds, `Palier ${i + 1}/${sequence.length}`))
    if (i < sequence.length - 1) blocks.push(block('rest', restSeconds, 'Repos'))
  })
  if (cooldownSeconds > 0) blocks.push(block('cooldown', cooldownSeconds, 'Récupération finale'))

  const totalActiveSeconds = sequence.reduce((s, w) => s + w, 0)
  return {
    index, week, day, title, blocks,
    estimatedCalories: estimateCalories(totalActiveSeconds, assumedCadence, 70),
  }
}

// ── Premiers Pas — débutant, 4 semaines, 3 séances/semaine ─────────
function buildFirstSteps(): JumpProgramWorkout[] {
  const weeks = [
    { work: 20, rest: 40, rounds: 6 },
    { work: 25, rest: 35, rounds: 7 },
    { work: 30, rest: 30, rounds: 8 },
    { work: 35, rest: 25, rounds: 9 },
  ]
  const workouts: JumpProgramWorkout[] = []
  let index = 0
  weeks.forEach((w, wi) => {
    for (let day = 1; day <= 3; day++) {
      workouts.push(buildIntervalWorkout(index, wi + 1, day, `Semaine ${wi + 1} · Séance ${day}`, w.work, w.rest, w.rounds, 90, 60, 90))
      index++
    }
  })
  return workouts
}

// ── Brûle & Sculpte — intermédiaire, 8 semaines, 4 séances/semaine ─
function buildBurnSculpt(): JumpProgramWorkout[] {
  const workouts: JumpProgramWorkout[] = []
  let index = 0
  for (let week = 1; week <= 8; week++) {
    const rest = Math.max(6, 22 - week * 2)
    const rounds = 8 + week
    for (let day = 1; day <= 4; day++) {
      workouts.push(buildIntervalWorkout(index, week, day, `Semaine ${week} · Séance ${day}`, 30, rest, rounds, 90, 90, 120))
      index++
    }
  }
  return workouts
}

// ── Poumons d'Acier — intermédiaire, 6 semaines, endurance, 3/semaine ─
function buildIronLungs(): JumpProgramWorkout[] {
  const workouts: JumpProgramWorkout[] = []
  let index = 0
  for (let week = 1; week <= 6; week++) {
    const workSeconds = 90 + week * 15
    for (let day = 1; day <= 3; day++) {
      workouts.push(buildIntervalWorkout(index, week, day, `Semaine ${week} · Séance ${day}`, workSeconds, 30, 4, 120, 90, 110))
      index++
    }
  }
  return workouts
}

// ── Afterburn — avancé, 6 semaines, HIIT + pyramides, 3/semaine ────
function buildAfterburn(): JumpProgramWorkout[] {
  const workouts: JumpProgramWorkout[] = []
  let index = 0
  for (let week = 1; week <= 6; week++) {
    const rounds = 8 + week
    workouts.push(buildIntervalWorkout(index, week, 1, `Semaine ${week} · Tabata`, 20, 10, rounds, 120, 90, 140))
    index++
    workouts.push(buildIntervalWorkout(index, week, 2, `Semaine ${week} · Intervalles serrés`, 25, Math.max(8, 20 - week), rounds, 120, 90, 140))
    index++
    const peak = 20 + week * 4
    workouts.push(buildPyramidWorkout(index, week, 3, `Semaine ${week} · Pyramide`, [10, 15, peak >= 20 ? 20 : peak, peak], 15, 120, 90, 140))
    index++
  }
  return workouts
}

export const JUMP_PROGRAMS: Record<JumpProgramId, JumpProgramDef> = {
  'first-steps': {
    id: 'first-steps',
    name: 'Premiers Pas',
    level: 'beginner',
    description: 'Un programme en douceur pour apprendre le rythme et construire une base solide, sans jamais brusquer la progression.',
    goal: 'Tenir un enchaînement régulier de sauts et gagner en confiance avec la corde.',
    weeks: 4,
    sessionsPerWeek: 3,
    workouts: buildFirstSteps(),
  },
  'burn-sculpt': {
    id: 'burn-sculpt',
    name: 'Brûle & Sculpte',
    level: 'intermediate',
    description: 'Des intervalles plus soutenus, avec une intensité et un volume qui augmentent semaine après semaine.',
    goal: 'Augmenter la dépense énergétique et l\'intensité générale des séances.',
    weeks: 8,
    sessionsPerWeek: 4,
    workouts: buildBurnSculpt(),
  },
  'iron-lungs': {
    id: 'iron-lungs',
    name: 'Poumons d\'Acier',
    level: 'intermediate',
    description: 'Un travail d\'endurance avec des séries longues et une récupération qui se réduit progressivement.',
    goal: 'Développer l\'endurance cardio-respiratoire sur des efforts continus.',
    weeks: 6,
    sessionsPerWeek: 3,
    workouts: buildIronLungs(),
  },
  afterburn: {
    id: 'afterburn',
    name: 'Afterburn',
    level: 'advanced',
    description: 'Intervalles à haute intensité, pyramides et séances rapides, avec une récupération contrôlée entre les efforts.',
    goal: 'Maximiser l\'intensité pour un effet afterburn (dépense calorique prolongée après l\'effort).',
    weeks: 6,
    sessionsPerWeek: 3,
    workouts: buildAfterburn(),
  },
}

export function getJumpProgram(id: JumpProgramId): JumpProgramDef {
  return JUMP_PROGRAMS[id]
}

export function getProgramWorkoutDurationSeconds(workout: JumpProgramWorkout): number {
  return workout.blocks.reduce((sum, b) => sum + b.durationSeconds, 0)
}
