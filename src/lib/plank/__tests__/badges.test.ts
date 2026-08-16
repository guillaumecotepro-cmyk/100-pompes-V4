import { describe, it, expect } from 'vitest'
import { checkNewPlankBadges, ALL_PLANK_BADGES } from '../badges'
import { DEFAULT_GAINAGE_DATA } from '../defaults'
import { GainageData, PlankSession } from '@/types/plank'

const NOW = new Date('2026-08-15T18:00:00')

function withSessions(sessions: PlankSession[], earnedBadges: string[] = []): GainageData {
  return { ...DEFAULT_GAINAGE_DATA, sessions, earnedBadges }
}

function completedSession(actualSeconds: number, date = NOW.toISOString()): PlankSession {
  return {
    id: Math.random().toString(36),
    mode: 'free',
    date,
    plannedDurationSeconds: actualSeconds,
    actualDurationSeconds: actualSeconds,
    totalHoldSeconds: actualSeconds,
    plannedSetCount: 1,
    sets: [{ order: 0, variant: 'forearm', targetSeconds: actualSeconds, actualSeconds, status: 'completed' }],
    restSeconds: 30,
    status: 'completed',
    difficultyFeedback: null,
    programId: null,
    programSessionIndex: null,
  }
}

describe('checkNewPlankBadges', () => {
  it('débloque "premier gainage" à la première séance terminée', () => {
    const badges = checkNewPlankBadges(withSessions([completedSession(20)]), false, NOW)
    expect(badges).toContain('plank_first')
  })

  it('ne débloque jamais deux fois le même badge', () => {
    const data = withSessions([completedSession(20)], ['plank_first'])
    const badges = checkNewPlankBadges(data, false, NOW)
    expect(badges).not.toContain('plank_first')
  })

  it('débloque le palier de durée correspondant à la meilleure série individuelle', () => {
    const badges = checkNewPlankBadges(withSessions([completedSession(65)]), false, NOW)
    expect(badges).toContain('plank_hold_60')
    expect(badges).not.toContain('plank_hold_75')
  })

  it('tous les ids de badges retournés existent dans le catalogue', () => {
    const badges = checkNewPlankBadges(withSessions([completedSession(130)]), true, NOW)
    const knownIds = new Set(ALL_PLANK_BADGES.map(b => b.id))
    for (const id of badges) expect(knownIds.has(id)).toBe(true)
  })

  it('"objectif atteint" ne se déclenche que si le paramètre goalReached est vrai', () => {
    expect(checkNewPlankBadges(withSessions([completedSession(30)]), false, NOW)).not.toContain('plank_goal_reached')
    expect(checkNewPlankBadges(withSessions([completedSession(30)]), true, NOW)).toContain('plank_goal_reached')
  })

  it('catalogue riche et progressif : au moins 30 badges distincts', () => {
    const ids = new Set(ALL_PLANK_BADGES.map(b => b.id))
    expect(ids.size).toBe(ALL_PLANK_BADGES.length) // pas de doublon
    expect(ALL_PLANK_BADGES.length).toBeGreaterThanOrEqual(30)
  })

  it('débloque les nouveaux paliers étendus (record, série, cumul)', () => {
    const highHold = checkNewPlankBadges(withSessions([completedSession(200)]), false, NOW)
    expect(highHold).toContain('plank_hold_180')
    expect(highHold).not.toContain('plank_hold_240')

    const manySessions = withSessions(Array.from({ length: 100 }, (_, i) => completedSession(10, new Date(2026, 0, i + 1).toISOString())))
    const badges = checkNewPlankBadges(manySessions, false, NOW)
    expect(badges).toContain('plank_sessions_100')
  })
})
