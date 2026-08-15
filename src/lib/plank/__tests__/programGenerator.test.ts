import { describe, it, expect } from 'vitest'
import {
  generatePlankProgram,
  getNextPlankProgramSession,
  getPlankProgramProgress,
  applyPlankFeedback,
  round5,
} from '../programGenerator'
import { PLANK_GOAL_PRESETS_SECONDS, CUSTOM_GOAL_MAX_SECONDS, MIN_SET_SECONDS } from '../config'
import { PROGRAM_TOTAL_SESSIONS } from '../config'

describe('round5', () => {
  it('arrondit au multiple de 5 le plus proche', () => {
    expect(round5(12)).toBe(10)
    expect(round5(13)).toBe(15)
    expect(round5(47)).toBe(45)
  })
  it('ne descend jamais sous 10s', () => {
    expect(round5(1)).toBe(10)
    expect(round5(0)).toBe(10)
  })
})

describe('generatePlankProgram — structure', () => {
  it.each(PLANK_GOAL_PRESETS_SECONDS)('génère 12 séances pour un objectif de %i s (test à 0s)', (goal) => {
    const program = generatePlankProgram(0, goal)
    expect(program.sessions).toHaveLength(PROGRAM_TOTAL_SESSIONS)
    expect(program.sessions.at(-1)!.isGoalAttempt).toBe(true)
    expect(program.sessions.at(-1)!.sets[0].targetSeconds).toBe(goal)
  })

  it('génère un programme valide pour un objectif personnalisé (durée max)', () => {
    const program = generatePlankProgram(60, CUSTOM_GOAL_MAX_SECONDS)
    expect(program.sessions).toHaveLength(PROGRAM_TOTAL_SESSIONS)
    expect(program.sessions.at(-1)!.sets[0].targetSeconds).toBe(CUSTOM_GOAL_MAX_SECONDS)
  })

  it('respecte les cas limites de résultat de test : 10, 30, 45, 60, 75, 90, 105, 120', () => {
    const cases = [10, 30, 45, 60, 75, 90, 105, 120]
    for (const initial of cases) {
      const goal = Math.max(initial + 30, 30)
      const program = generatePlankProgram(initial, goal)
      for (const session of program.sessions) {
        for (const set of session.sets) {
          expect(set.targetSeconds).toBeGreaterThanOrEqual(MIN_SET_SECONDS)
          expect(set.targetSeconds % 5).toBe(0)
        }
      }
    }
  })

  it('aucune séance ne dépasse jamais l\'objectif', () => {
    const program = generatePlankProgram(20, 60)
    for (const session of program.sessions) {
      for (const set of session.sets) {
        expect(set.targetSeconds).toBeLessThanOrEqual(60)
      }
    }
  })

  it('propose un programme d\'entretien si le résultat initial dépasse déjà l\'objectif (pas de fausse progression)', () => {
    const program = generatePlankProgram(150, 120)
    const maxima = program.sessions.slice(0, -1).map(s => Math.max(...s.sets.map(x => x.targetSeconds)))
    // Toutes les séances d'entraînement restent proches du niveau de l'objectif, pas de montée en charge fictive
    for (const m of maxima) {
      expect(m).toBeLessThanOrEqual(120)
      expect(m).toBeGreaterThanOrEqual(60)
    }
  })

  it('progression sans saut brutal : le maximum de chaque séance ne redescend jamais sous celui de la précédente', () => {
    const program = generatePlankProgram(15, 120)
    let prevMax = 0
    for (const session of program.sessions) {
      const max = Math.max(...session.sets.map(s => s.targetSeconds))
      expect(max).toBeGreaterThanOrEqual(prevMax)
      prevMax = max
    }
  })

  it('le nombre de séries diminue globalement au fil du programme (approche du maintien continu)', () => {
    const program = generatePlankProgram(15, 120)
    const firstWeekSets = program.sessions[0].sets.length
    const lastTrainingSets = program.sessions.at(-2)!.sets.length
    expect(lastTrainingSets).toBeLessThan(firstWeekSets)
  })

  it('repos configurable, 30s par défaut, 0 sur la dernière série de chaque séance', () => {
    const program = generatePlankProgram(15, 90)
    const session = program.sessions[0]
    expect(session.sets.at(-1)!.restSeconds).toBe(0)
    if (session.sets.length > 1) expect(session.sets[0].restSeconds).toBe(30)

    const customRest = generatePlankProgram(15, 90, { restSeconds: 45 })
    expect(customRest.sessions[0].sets[0].restSeconds).toBe(45)
  })

  it('est déterministe : mêmes entrées → mêmes durées (hors id/date)', () => {
    const a = generatePlankProgram(20, 90)
    const b = generatePlankProgram(20, 90)
    expect(a.sessions.map(s => s.sets.map(x => x.targetSeconds))).toEqual(
      b.sessions.map(s => s.sets.map(x => x.targetSeconds))
    )
  })
})

describe('getNextPlankProgramSession / getPlankProgramProgress', () => {
  it('retourne la première séance pending et une progression à 0%', () => {
    const program = generatePlankProgram(15, 60)
    expect(getNextPlankProgramSession(program)?.index).toBe(0)
    expect(getPlankProgramProgress(program)).toBe(0)
  })

  it('retourne null et 100% quand tout est fait', () => {
    const program = generatePlankProgram(15, 60)
    program.sessions.forEach(s => { s.status = 'done' })
    expect(getNextPlankProgramSession(program)).toBeNull()
    expect(getPlankProgramProgress(program)).toBe(100)
  })
})

describe('applyPlankFeedback', () => {
  it('"correcte" ne modifie rien', () => {
    const program = generatePlankProgram(15, 90)
    const result = applyPlankFeedback(program, 0, 'ok')
    expect(result).toBe(program)
  })

  it('"trop facile" augmente légèrement les séances futures restantes, sans dépasser l\'objectif', () => {
    const program = generatePlankProgram(15, 90)
    const before = program.sessions[3].sets[0].targetSeconds
    const result = applyPlankFeedback(program, 1, 'easy')
    const after = result.sessions[3].sets[0].targetSeconds
    expect(after).toBeGreaterThanOrEqual(before)
    for (const s of result.sessions) {
      for (const set of s.sets) expect(set.targetSeconds).toBeLessThanOrEqual(90)
    }
  })

  it('"trop difficile" réduit légèrement les séances futures restantes, sans descendre sous le minimum', () => {
    const program = generatePlankProgram(15, 90)
    const before = program.sessions[3].sets[0].targetSeconds
    const result = applyPlankFeedback(program, 1, 'hard')
    const after = result.sessions[3].sets[0].targetSeconds
    expect(after).toBeLessThanOrEqual(before)
    for (const s of result.sessions) {
      for (const set of s.sets) expect(set.targetSeconds).toBeGreaterThanOrEqual(MIN_SET_SECONDS)
    }
  })

  it('ne modifie jamais les séances déjà faites (pas de réécriture rétroactive)', () => {
    const program = generatePlankProgram(15, 90)
    program.sessions[0].status = 'done'
    const before = JSON.stringify(program.sessions[0])
    const result = applyPlankFeedback(program, 1, 'hard')
    expect(JSON.stringify(result.sessions[0])).toBe(before)
  })

  it('ne modifie jamais la séance finale (tentative de l\'objectif)', () => {
    const program = generatePlankProgram(15, 90)
    const result = applyPlankFeedback(program, 0, 'easy')
    expect(result.sessions.at(-1)!.sets[0].targetSeconds).toBe(90)
  })

  it('le décalage cumulé est plafonné (adaptation limitée et explicable)', () => {
    let program = generatePlankProgram(15, 120)
    for (let i = 0; i < 10; i++) {
      program = applyPlankFeedback(program, 0, 'easy')
    }
    const cumulative = program.adaptations.reduce((s, a) => s + a.adjustmentSeconds, 0)
    expect(cumulative).toBeLessThanOrEqual(30)
  })
})
