import { describe, it, expect } from 'vitest'
import { migrateAppData, checkNewBadges, STORAGE_SCHEMA_VERSION, DEFAULT_APP_DATA } from '../storage'

describe('migrateAppData — non-régression Pompes', () => {
  it('des données Pompes v1 (sans champ gainage) sont préservées intégralement après migration', () => {
    const legacy = {
      schemaVersion: 1,
      profile: { id: 'u1', name: 'Alex', initialTestScore: 12, level: 'intermediate', createdAt: '2026-01-01T00:00:00.000Z', avatarColor: '#f97316' },
      stats: { totalPushups: 340, totalSessions: 12, currentStreak: 4, bestStreak: 9, bestSingleSet: 22, bestSession: 60, lastSessionDate: '2026-08-10T00:00:00.000Z', weeklyPushups: 80 },
      program: { level: 'intermediate', initialScore: 12, goal: 100, sessions: [], currentSessionIndex: 3, startDate: '2026-01-01T00:00:00.000Z' },
      history: [{ id: 'h1', date: '2026-08-10T00:00:00.000Z', sessionIndex: 2, week: 1, day: 3, sets: [], totalReps: 40, targetReps: 40, completed: true, duration: 120 }],
      earnedBadges: ['first_session', 'score_10'],
      onboarded: true,
      preferredSensorMode: 'tap',
    }

    const migrated = migrateAppData(legacy)

    expect(migrated.schemaVersion).toBe(STORAGE_SCHEMA_VERSION)
    expect(migrated.profile).toEqual(legacy.profile)
    expect(migrated.stats).toEqual(legacy.stats)
    expect(migrated.program).toEqual(legacy.program)
    expect(migrated.history).toEqual(legacy.history)
    expect(migrated.earnedBadges).toEqual(legacy.earnedBadges)
    expect(migrated.onboarded).toBe(true)
  })

  it('ajoute un bloc gainage par défaut valide et sûr sur des données sans ce champ', () => {
    const migrated = migrateAppData({ onboarded: true })
    expect(migrated.gainage).toBeDefined()
    expect(migrated.gainage.onboarded).toBe(false)
    expect(migrated.gainage.sessions).toEqual([])
    expect(migrated.gainage.tests).toEqual([])
    expect(migrated.gainage.programs).toEqual([])
    expect(migrated.gainage.settings.voiceEnabled).toBe(true)
  })

  it('préserve un bloc gainage déjà existant lors d\'une remigration (idempotence)', () => {
    const once = migrateAppData({ gainage: { onboarded: true, sessions: [{ id: 's1' }] } })
    const twice = migrateAppData(once)
    expect(twice.gainage.onboarded).toBe(true)
    expect(twice.gainage.sessions).toHaveLength(1)
  })

  it('ne plante jamais sur des données corrompues ou vides — retombe sur les valeurs par défaut', () => {
    expect(() => migrateAppData(null)).not.toThrow()
    expect(() => migrateAppData(undefined)).not.toThrow()
    expect(() => migrateAppData('garbage')).not.toThrow()
    expect(migrateAppData(null).gainage).toBeDefined()
  })

  it('DEFAULT_APP_DATA contient un état gainage cohérent', () => {
    expect(DEFAULT_APP_DATA.gainage.onboarded).toBe(false)
    expect(DEFAULT_APP_DATA.gainage.activeProgramId).toBeNull()
  })
})

describe('checkNewBadges — comportement Pompes inchangé après généralisation du moteur', () => {
  it('débloque les mêmes badges qu\'avant pour les mêmes seuils', () => {
    const data = {
      ...DEFAULT_APP_DATA,
      stats: { ...DEFAULT_APP_DATA.stats, totalSessions: 1, currentStreak: 3, totalPushups: 100, bestSingleSet: 100 },
      profile: { id: 'u', name: 'A', initialTestScore: 10, level: 'beginner' as const, createdAt: '', avatarColor: '#000' },
      earnedBadges: [],
    }
    const badges = checkNewBadges(data)
    expect(badges).toContain('first_session')
    expect(badges).toContain('streak_3')
    expect(badges).toContain('score_10')
    expect(badges).toContain('total_100')
    expect(badges).toContain('goal_100')
  })

  it('ne redébloque jamais un badge déjà acquis', () => {
    const data = {
      ...DEFAULT_APP_DATA,
      stats: { ...DEFAULT_APP_DATA.stats, totalSessions: 1 },
      earnedBadges: ['first_session'],
    }
    expect(checkNewBadges(data)).not.toContain('first_session')
  })
})
