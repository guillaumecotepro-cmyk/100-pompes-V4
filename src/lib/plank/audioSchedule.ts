export type TickAudioEvent = 'countdown' | 'beep' | 'silent'

/**
 * Décide QUEL son doit jouer à un instant donné du maintien, à partir du
 * temps écoulé et du temps restant dans la série. Fonction pure — aucune
 * dépendance à l'horloge ou à l'audio réel — pour rester testable et
 * déterministe.
 *
 * Règles :
 * - Les 10 dernières secondes déclenchent le décompte vocal (priorité absolue).
 * - Le bip des dizaines ne joue qu'en dehors de cette fenêtre finale, donc
 *   jamais en même temps que le décompte : aucune collision possible.
 * - Une série de 10 s ou moins démarre directement en décompte vocal.
 */
export function getTickAudioEvent(elapsedSeconds: number, remainingSeconds: number): TickAudioEvent {
  if (remainingSeconds <= 0) return 'silent'
  if (remainingSeconds <= 10) return 'countdown'
  if (elapsedSeconds > 0 && elapsedSeconds % 10 === 0) return 'beep'
  return 'silent'
}

/** Chiffre à prononcer pendant le décompte final (1 à 10). */
export function getCountdownDigit(remainingSeconds: number): number {
  return Math.max(1, Math.min(10, Math.round(remainingSeconds)))
}
