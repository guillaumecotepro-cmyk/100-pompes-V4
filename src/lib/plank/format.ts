/** Formatage partagé des durées Gainage : "30 s", "1 min", "1 min 15". */
export function formatPlankGoal(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  if (m === 0) return `${s} s`
  if (s === 0) return `${m} min`
  return `${m} min ${String(s).padStart(2, '0')}`
}

/** mm:ss pour affichage minuteur ("01:45"). */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

/**
 * Durée longue "heures / minutes / secondes" pour des cumuls pouvant
 * dépasser l'heure (ex. temps total de gainage) : "2 h 15 min", "38 min 12 s", "45 s".
 * N'affiche que les unités pertinentes.
 */
export function formatDurationHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60

  if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`
  if (m > 0) return r > 0 ? `${m} min ${r} s` : `${m} min`
  return `${r} s`
}

export function parseMinutesSecondsInput(minutes: string, seconds: string): number | null {
  const m = minutes.trim() === '' ? 0 : Number(minutes)
  const s = seconds.trim() === '' ? 0 : Number(seconds)
  if (!Number.isFinite(m) || !Number.isFinite(s) || m < 0 || s < 0 || s > 59) return null
  return Math.round(m * 60 + s)
}
