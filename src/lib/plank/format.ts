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

export function parseMinutesSecondsInput(minutes: string, seconds: string): number | null {
  const m = minutes.trim() === '' ? 0 : Number(minutes)
  const s = seconds.trim() === '' ? 0 : Number(seconds)
  if (!Number.isFinite(m) || !Number.isFinite(s) || m < 0 || s < 0 || s > 59) return null
  return Math.round(m * 60 + s)
}
