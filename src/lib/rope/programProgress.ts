import { JumpProgramDef, JumpProgramId, JumpProgramProgress, JumpProgramWorkout } from '@/types/rope'

export function createProgramProgress(programId: JumpProgramId): JumpProgramProgress {
  return {
    programId,
    startDate: new Date().toISOString(),
    currentWorkoutIndex: 0,
    workoutStatus: {},
    status: 'active',
  }
}

export function getNextWorkout(program: JumpProgramDef, progress: JumpProgramProgress | null): JumpProgramWorkout | null {
  if (!progress) return program.workouts[0] ?? null
  return program.workouts.find(w => progress.workoutStatus[w.index] !== 'done') ?? null
}

export function getProgramProgressPercent(program: JumpProgramDef, progress: JumpProgramProgress | null): number {
  if (!progress || program.workouts.length === 0) return 0
  const done = program.workouts.filter(w => progress.workoutStatus[w.index] === 'done').length
  return Math.round((done / program.workouts.length) * 100)
}

/** Marque une séance terminée (ou à refaire) — ne modifie jamais rétroactivement les autres séances. */
export function markWorkoutStatus(
  program: JumpProgramDef,
  progress: JumpProgramProgress,
  workoutIndex: number,
  status: 'done' | 'to_redo'
): JumpProgramProgress {
  const workoutStatus = { ...progress.workoutStatus, [workoutIndex]: status }
  const allDone = program.workouts.every(w => workoutStatus[w.index] === 'done')
  const nextIndex = status === 'done' ? Math.max(progress.currentWorkoutIndex, workoutIndex + 1) : progress.currentWorkoutIndex
  return {
    ...progress,
    workoutStatus,
    currentWorkoutIndex: Math.min(nextIndex, program.workouts.length),
    status: allDone ? 'completed' : progress.status,
  }
}
