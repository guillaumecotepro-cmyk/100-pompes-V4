import { RemindersSettings } from '@/types'

export interface ActivityDoneToday {
  pompes: boolean
  gainage: boolean
  jumprope: boolean
}

/** Le rappel est-il "dû" à cet instant (jour + heure atteints) ? */
export function isReminderDueNow(reminders: RemindersSettings, now: Date = new Date()): boolean {
  if (!reminders.enabled) return false
  if (!reminders.days.includes(now.getDay())) return false
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const dueMinutes = reminders.hour * 60 + reminders.minute
  return nowMinutes >= dueMinutes
}

/**
 * Faut-il afficher le rappel ? Uniquement si dû ET qu'au moins une des
 * activités choisies dans les réglages n'a pas encore été faite aujourd'hui.
 * Pure et testable — l'horloge (`now`) est injectable.
 */
export function shouldShowReminder(
  reminders: RemindersSettings,
  done: ActivityDoneToday,
  now: Date = new Date()
): boolean {
  if (!isReminderDueNow(reminders, now)) return false
  return reminders.activities.some(activity => !done[activity])
}
