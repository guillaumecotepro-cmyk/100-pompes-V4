import { describe, it, expect } from 'vitest'
import { estimateCalories, estimateMetFromCadence, buildIntervalBlocks, INTERVAL_TEMPLATES } from '../config'

describe('estimateMetFromCadence', () => {
  it('MET croissant avec la cadence', () => {
    const slow = estimateMetFromCadence(40)
    const moderate = estimateMetFromCadence(80)
    const fast = estimateMetFromCadence(180)
    expect(moderate).toBeGreaterThan(slow)
    expect(fast).toBeGreaterThan(moderate)
  })

  it('valeur par défaut raisonnable si cadence nulle ou négative', () => {
    expect(estimateMetFromCadence(0)).toBeGreaterThan(0)
    expect(estimateMetFromCadence(-5)).toBeGreaterThan(0)
  })
})

describe('estimateCalories', () => {
  it('zéro durée active -> zéro calorie (jamais de valeur inventée)', () => {
    expect(estimateCalories(0, 100, 70)).toBe(0)
  })

  it('augmente avec la durée active, à cadence et poids fixes', () => {
    const short = estimateCalories(300, 100, 70)
    const long = estimateCalories(600, 100, 70)
    expect(long).toBeGreaterThan(short)
  })

  it('augmente avec le poids, à durée et cadence fixes', () => {
    const light = estimateCalories(600, 100, 60)
    const heavy = estimateCalories(600, 100, 90)
    expect(heavy).toBeGreaterThan(light)
  })

  it('utilise un poids par défaut prudent si non renseigné, sans planter', () => {
    expect(() => estimateCalories(600, 100, null)).not.toThrow()
    expect(estimateCalories(600, 100, null)).toBeGreaterThan(0)
  })

  it('retourne toujours un entier', () => {
    expect(Number.isInteger(estimateCalories(437, 123, 68))).toBe(true)
  })
})

describe('buildIntervalBlocks', () => {
  it('un modèle classique génère échauffement + N blocs travail/repos alternés + récupération', () => {
    const template = INTERVAL_TEMPLATES.find(t => t.id === 'classic_30_15')!
    const blocks = buildIntervalBlocks(template)
    expect(blocks[0]).toMatchObject({ type: 'warmup' })
    expect(blocks[blocks.length - 1]).toMatchObject({ type: 'cooldown' })
    expect(blocks.filter(b => b.type === 'work')).toHaveLength(template.rounds)
    expect(blocks.filter(b => b.type === 'rest')).toHaveLength(template.rounds - 1)
  })

  it('la pyramide est symétrique (montée puis descente)', () => {
    const template = INTERVAL_TEMPLATES.find(t => t.isPyramid)!
    const blocks = buildIntervalBlocks(template)
    const workDurations = blocks.filter(b => b.type === 'work').map(b => b.durationSeconds)
    expect(workDurations).toEqual([...workDurations].reverse())
  })

  it('toutes les durées de bloc sont strictement positives', () => {
    for (const template of INTERVAL_TEMPLATES) {
      for (const block of buildIntervalBlocks(template)) {
        expect(block.durationSeconds).toBeGreaterThan(0)
      }
    }
  })
})
