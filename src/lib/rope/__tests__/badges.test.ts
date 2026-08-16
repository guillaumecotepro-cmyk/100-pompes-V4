import { describe, it, expect } from 'vitest'
import { ALL_JUMP_BADGES, checkNewJumpBadges } from '../badges'
import { DEFAULT_JUMPROPE_DATA } from '../defaults'
import { JumpRopeData, JumpSession } from '@/types/rope'

function session(overrides: Partial<JumpSession> = {}): JumpSession {
  return {
    id: Math.random().toString(36), mode: 'free', date: '2026-08-15T10:00:00.000Z', endDate: '2026-08-15T10:05:00.000Z',
    timezone: 'Europe/Paris', totalDurationSeconds: 300, activeDurationSeconds: 250, totalJumps: 300,
    avgCadence: 100, maxCadence: 130, caloriesEstimated: 50, heartRateAvg: null, countingMethod: 'manual',
    countingAlgorithmVersion: 1, series: [], bestStreak: 300, manualCorrection: false, notes: null, journal: null,
    programId: null, programWorkoutIndex: null, challengeId: null, challengeDay: null, status: 'completed',
    clipId: null, virtual: false, ...overrides,
  }
}

function data(overrides: Partial<JumpRopeData> = {}): JumpRopeData {
  return { ...DEFAULT_JUMPROPE_DATA, ...overrides }
}

describe('catalogue des 50 badges Corde à sauter', () => {
  it('contient exactement 50 badges, tous avec un id unique', () => {
    expect(ALL_JUMP_BADGES).toHaveLength(50)
    expect(new Set(ALL_JUMP_BADGES.map(b => b.id)).size).toBe(50)
  })

  it('répartit les badges dans les 6 catégories attendues avec le bon nombre par catégorie', () => {
    const byCategory = ALL_JUMP_BADGES.reduce<Record<string, number>>((acc, b) => {
      acc[b.category] = (acc[b.category] ?? 0) + 1
      return acc
    }, {})
    expect(byCategory.debuts).toBe(8)
    expect(byCategory.volume).toBe(10)
    expect(byCategory.series).toBe(8)
    expect(byCategory.grosses_seances).toBe(8)
    expect(byCategory.vitesse).toBe(8)
    expect(byCategory.endurance).toBe(8)
  })

  it('chaque badge a un palier (bronze/argent/or)', () => {
    for (const b of ALL_JUMP_BADGES) {
      expect(['bronze', 'argent', 'or']).toContain(b.tier)
    }
  })
})

describe('checkNewJumpBadges', () => {
  it('tous les ids retournés existent dans le catalogue (pas de badge fantôme)', () => {
    const jumprope = data({ sessions: [session({ totalJumps: 5000 })] })
    const unlocked = checkNewJumpBadges(jumprope)
    const ids = new Set(ALL_JUMP_BADGES.map(b => b.id))
    for (const id of unlocked) expect(ids.has(id)).toBe(true)
  })

  it('aucune séance -> aucun badge débloqué', () => {
    expect(checkNewJumpBadges(data())).toEqual([])
  })

  it('première séance terminée -> débloque "jr_debuts_1" mais pas les paliers de volume', () => {
    const unlocked = checkNewJumpBadges(data({ sessions: [session({ totalJumps: 50 })] }))
    expect(unlocked).toContain('jr_debuts_1')
    expect(unlocked).not.toContain('jr_volume_500')
  })

  it('une grosse séance de 1000 sauts débloque le palier "grosses séances" correspondant sans débloquer les paliers au-delà', () => {
    const unlocked = checkNewJumpBadges(data({ sessions: [session({ totalJumps: 1000 })] }))
    expect(unlocked).toContain('jr_grosse_seance_1000')
    expect(unlocked).not.toContain('jr_grosse_seance_1500')
  })

  it('une cadence de pointe sur une séance trop courte ne débloque pas le badge vitesse', () => {
    const unlocked = checkNewJumpBadges(data({ sessions: [session({ avgCadence: 200, activeDurationSeconds: 5 })] }))
    expect(unlocked).not.toContain('jr_vitesse_200')
  })

  it('les badges déjà gagnés ne sont jamais retournés une seconde fois', () => {
    const jumprope = data({ sessions: [session({ totalJumps: 500 })], earnedBadges: ['jr_debuts_1', 'jr_volume_500'] })
    const unlocked = checkNewJumpBadges(jumprope)
    expect(unlocked).not.toContain('jr_debuts_1')
    expect(unlocked).not.toContain('jr_volume_500')
  })

  it('une séance interrompue ne contribue à aucun palier', () => {
    const unlocked = checkNewJumpBadges(data({ sessions: [session({ totalJumps: 5000, status: 'interrupted' })] }))
    expect(unlocked).toEqual([])
  })
})
