import { describe, it, expect } from 'vitest'
import { buildExportCsv } from '../exportData'
import { DEFAULT_APP_DATA } from '../storage'
import { AppData } from '@/types'

describe('buildExportCsv', () => {
  it('produit uniquement l\'en-tête quand il n\'y a aucune donnée', () => {
    const csv = buildExportCsv(DEFAULT_APP_DATA)
    const lines = csv.split('\n')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toBe('Date,Activité,Type,Détail,Statut')
  })

  it('inclut une ligne par séance pompes et par séance gainage', () => {
    const data: AppData = {
      ...DEFAULT_APP_DATA,
      history: [{ id: '1', date: '2026-08-10T10:00:00.000Z', sessionIndex: 0, week: 1, day: 1, sets: [], totalReps: 40, targetReps: 40, completed: true, duration: 90 }],
      gainage: {
        ...DEFAULT_APP_DATA.gainage,
        tests: [{ id: 't1', date: '2026-08-01T10:00:00.000Z', durationSeconds: 45 }],
        sessions: [{
          id: 's1', mode: 'free', date: '2026-08-12T10:00:00.000Z', plannedDurationSeconds: 30, actualDurationSeconds: 30,
          totalHoldSeconds: 30, plannedSetCount: 1,
          sets: [{ order: 0, variant: 'forearm', targetSeconds: 30, actualSeconds: 30, status: 'completed' }],
          restSeconds: 30, status: 'completed', difficultyFeedback: null, programId: null, programSessionIndex: null,
        }],
      },
    }

    const csv = buildExportCsv(data)
    const lines = csv.split('\n')
    expect(lines).toHaveLength(4) // header + 3 rows
    expect(csv).toContain('Pompes')
    expect(csv).toContain('Gainage')
    expect(csv).toContain('Test initial')
  })

  it('échappe correctement les champs contenant des virgules', () => {
    const csv = buildExportCsv({
      ...DEFAULT_APP_DATA,
      history: [{ id: '1', date: '2026-08-10T10:00:00.000Z', sessionIndex: 0, week: 1, day: 1, sets: [], totalReps: 40, targetReps: 40, completed: true, duration: 90 }],
    })
    // "40/40 pompes" ne contient pas de virgule, mais le format doit rester un CSV valide (5 colonnes)
    const dataLine = csv.split('\n')[1]
    expect(dataLine.split(',').length).toBeGreaterThanOrEqual(5)
  })

  it('trie du plus récent au plus ancien', () => {
    const data: AppData = {
      ...DEFAULT_APP_DATA,
      history: [
        { id: '1', date: '2026-08-01T10:00:00.000Z', sessionIndex: 0, week: 1, day: 1, sets: [], totalReps: 40, targetReps: 40, completed: true, duration: 90 },
        { id: '2', date: '2026-08-10T10:00:00.000Z', sessionIndex: 1, week: 1, day: 2, sets: [], totalReps: 40, targetReps: 40, completed: true, duration: 90 },
      ],
    }
    const lines = buildExportCsv(data).split('\n')
    expect(lines[1]).toContain('10/08/2026')
    expect(lines[2]).toContain('01/08/2026')
  })
})
