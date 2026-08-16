/** mm:ss pour affichage minuteur ("01:45"). */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

/** Durée longue, n'affiche que les unités pertinentes : "2 h 15 min", "38 min 12 s", "45 s". */
export function formatDurationHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60

  if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`
  if (m > 0) return r > 0 ? `${m} min ${r} s` : `${m} min`
  return `${r} s`
}

export function formatJumps(n: number): string {
  return Math.round(n).toLocaleString('fr-FR')
}

export function formatCadence(cadence: number): string {
  return `${Math.round(cadence)} sauts/min`
}

export const COUNTING_METHOD_LABELS: Record<string, string> = {
  camera: 'Caméra',
  motion: 'Mouvement (téléphone)',
  manual: 'Saisie manuelle',
  bluetooth: 'Corde connectée',
}
