import { describe, it, expect } from 'vitest'
import { isReminderDueNow, shouldShowReminder } from '../reminders'
import { RemindersSettings } from '@/types'

function reminders(overrides: Partial<RemindersSettings> = {}): RemindersSettings {
  return { enabled: true, days: [6], hour: 18, minute: 0, activities: ['pompes', 'gainage'], ...overrides }
}

// Samedi 15 août 2026
const SATURDAY_1859 = new Date('2026-08-15T18:59:00')
const SATURDAY_1801 = new Date('2026-08-15T18:01:00')
const SATURDAY_1759 = new Date('2026-08-15T17:59:00')
const SUNDAY_1900 = new Date('2026-08-16T19:00:00')

describe('isReminderDueNow', () => {
  it('faux si désactivé', () => {
    expect(isReminderDueNow(reminders({ enabled: false }), SATURDAY_1859)).toBe(false)
  })

  it('faux un jour non sélectionné', () => {
    expect(isReminderDueNow(reminders(), SUNDAY_1900)).toBe(false)
  })

  it('faux avant l\'heure programmée', () => {
    expect(isReminderDueNow(reminders(), SATURDAY_1759)).toBe(false)
  })

  it('vrai à partir de l\'heure programmée, le bon jour', () => {
    expect(isReminderDueNow(reminders(), SATURDAY_1801)).toBe(true)
    expect(isReminderDueNow(reminders(), SATURDAY_1859)).toBe(true)
  })
})

describe('shouldShowReminder', () => {
  it('ne montre rien si les deux activités choisies sont déjà faites', () => {
    const r = reminders()
    expect(shouldShowReminder(r, { pompes: true, gainage: true }, SATURDAY_1859)).toBe(false)
  })

  it('montre le rappel si au moins une activité choisie manque', () => {
    const r = reminders()
    expect(shouldShowReminder(r, { pompes: true, gainage: false }, SATURDAY_1859)).toBe(true)
    expect(shouldShowReminder(r, { pompes: false, gainage: true }, SATURDAY_1859)).toBe(true)
  })

  it('ne considère que les activités sélectionnées dans les réglages', () => {
    const r = reminders({ activities: ['gainage'] })
    // Pompes non fait, mais pas sélectionné -> ne doit pas déclencher
    expect(shouldShowReminder(r, { pompes: false, gainage: true }, SATURDAY_1859)).toBe(false)
    expect(shouldShowReminder(r, { pompes: true, gainage: false }, SATURDAY_1859)).toBe(true)
  })

  it('rien si le rappel n\'est pas dû', () => {
    expect(shouldShowReminder(reminders(), { pompes: false, gainage: false }, SATURDAY_1759)).toBe(false)
  })
})
