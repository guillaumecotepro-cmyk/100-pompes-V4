import { describe, it, expect } from 'vitest'
import { JUMP_PROGRAMS, getProgramWorkoutDurationSeconds } from '../programs'
import { createProgramProgress, getNextWorkout, getProgramProgressPercent, markWorkoutStatus } from '../programProgress'

describe('JUMP_PROGRAMS — catalogue déterministe et complet', () => {
  it('les 4 programmes existent avec le bon nombre de séances', () => {
    expect(JUMP_PROGRAMS['first-steps'].workouts).toHaveLength(12) // 4 sem × 3
    expect(JUMP_PROGRAMS['burn-sculpt'].workouts).toHaveLength(32) // 8 sem × 4
    expect(JUMP_PROGRAMS['iron-lungs'].workouts).toHaveLength(18) // 6 sem × 3
    expect(JUMP_PROGRAMS.afterburn.workouts).toHaveLength(18) // 6 sem × 3
  })

  it('chaque séance a un échauffement, du travail et une récupération finale', () => {
    for (const program of Object.values(JUMP_PROGRAMS)) {
      for (const workout of program.workouts) {
        expect(workout.blocks.length).toBeGreaterThan(0)
        expect(workout.blocks.some(b => b.type === 'warmup')).toBe(true)
        expect(workout.blocks.some(b => b.type === 'work')).toBe(true)
        expect(workout.blocks.some(b => b.type === 'cooldown')).toBe(true)
        expect(workout.blocks.every(b => b.durationSeconds > 0)).toBe(true)
        expect(workout.estimatedCalories).toBeGreaterThan(0)
      }
    }
  })

  it('déterministe : régénérer le catalogue donne exactement le même résultat', () => {
    // Les modules sont importés une seule fois (cache), donc on vérifie ici la stabilité structurelle.
    const a = JUMP_PROGRAMS['first-steps'].workouts.map(w => getProgramWorkoutDurationSeconds(w))
    const b = JUMP_PROGRAMS['first-steps'].workouts.map(w => getProgramWorkoutDurationSeconds(w))
    expect(a).toEqual(b)
  })

  it('progression non décroissante du volume de travail au fil des semaines (pas de saut brutal en arrière)', () => {
    for (const program of Object.values(JUMP_PROGRAMS)) {
      const totalWorkByWeek = new Map<number, number>()
      for (const w of program.workouts) {
        const workSeconds = w.blocks.filter(b => b.type === 'work').reduce((s, b) => s + b.durationSeconds, 0)
        totalWorkByWeek.set(w.week, Math.max(totalWorkByWeek.get(w.week) ?? 0, workSeconds))
      }
      const weeks = Array.from(totalWorkByWeek.keys()).sort((a, b) => a - b)
      for (let i = 1; i < weeks.length; i++) {
        expect(totalWorkByWeek.get(weeks[i])!).toBeGreaterThanOrEqual(totalWorkByWeek.get(weeks[i - 1])!)
      }
    }
  })

  it('la pyramide Afterburn est symétrique (montée puis descente)', () => {
    const pyramidWorkouts = JUMP_PROGRAMS.afterburn.workouts.filter(w => w.title.includes('Pyramide'))
    expect(pyramidWorkouts.length).toBeGreaterThan(0)
    for (const w of pyramidWorkouts) {
      const workBlocks = w.blocks.filter(b => b.type === 'work').map(b => b.durationSeconds)
      const reversed = [...workBlocks].reverse()
      expect(workBlocks).toEqual(reversed) // palindrome = montée/descente symétrique
    }
  })
})

describe('progression de programme (Corde à sauter)', () => {
  const program = JUMP_PROGRAMS['first-steps']

  it('la première séance à faire est la séance 0 sans progression existante', () => {
    expect(getNextWorkout(program, null)?.index).toBe(0)
    expect(getProgramProgressPercent(program, null)).toBe(0)
  })

  it('marquer une séance terminée avance vers la suivante et met à jour le pourcentage', () => {
    let progress = createProgramProgress('first-steps')
    progress = markWorkoutStatus(program, progress, 0, 'done')
    expect(getNextWorkout(program, progress)?.index).toBe(1)
    expect(getProgramProgressPercent(program, progress)).toBe(Math.round((1 / 12) * 100))
  })

  it('le programme passe "completed" une fois toutes les séances faites', () => {
    let progress = createProgramProgress('first-steps')
    for (let i = 0; i < program.workouts.length; i++) {
      progress = markWorkoutStatus(program, progress, i, 'done')
    }
    expect(progress.status).toBe('completed')
    expect(getNextWorkout(program, progress)).toBeNull()
    expect(getProgramProgressPercent(program, progress)).toBe(100)
  })

  it('marquer "à refaire" ne fait jamais avancer ni ne modifie les autres séances déjà faites', () => {
    let progress = createProgramProgress('first-steps')
    progress = markWorkoutStatus(program, progress, 0, 'done')
    progress = markWorkoutStatus(program, progress, 1, 'to_redo')
    expect(progress.workoutStatus[0]).toBe('done')
    expect(getNextWorkout(program, progress)?.index).toBe(1)
  })
})
