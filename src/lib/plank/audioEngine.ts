import { PlankSettings } from '@/types/plank'
import { getTickAudioEvent, getCountdownDigit } from './audioSchedule'

/**
 * Moteur audio du module Gainage.
 *
 * Choix d'architecture : aucun fichier son n'est embarqué. La voix française
 * utilise la Web Speech API (`speechSynthesis`, voix du système, disponible
 * hors-ligne) et les bips/gong sont synthétisés via Web Audio (oscillateurs).
 * Cela évite d'ajouter une dépendance et des assets binaires, garantit un
 * fonctionnement 100% hors-ligne, et élimine tout temps de chargement réseau.
 * Limite connue : le rendu vocal dépend des voix installées sur l'appareil
 * (qualité variable selon OS/navigateur) — documentée dans le compte rendu.
 */
export class PlankAudioEngine {
  private ctx: AudioContext | null = null
  private settings: PlankSettings
  private frenchVoice: SpeechSynthesisVoice | null = null
  private lastTickKey: string | null = null

  constructor(settings: PlankSettings) {
    this.settings = settings
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadFrenchVoice()
      window.speechSynthesis.addEventListener('voiceschanged', () => this.loadFrenchVoice())
    }
  }

  updateSettings(settings: PlankSettings) {
    this.settings = settings
  }

  private loadFrenchVoice() {
    const voices = window.speechSynthesis.getVoices()
    this.frenchVoice = voices.find(v => v.lang?.toLowerCase().startsWith('fr')) ?? null
  }

  /** À appeler depuis un geste utilisateur (bouton Démarrer) pour lever les restrictions d'autoplay iOS/Safari. */
  resume() {
    if (typeof window === 'undefined') return
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Ctor) this.ctx = new Ctor()
    }
    if (this.ctx?.state === 'suspended') void this.ctx.resume()
  }

  private tone(frequencies: number[], durationMs: number, gainValue = 0.18) {
    if (!this.ctx) return
    const now = this.ctx.currentTime
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(gainValue, now + 0.01)
    gain.gain.linearRampToValueAtTime(0, now + durationMs / 1000)
    gain.connect(this.ctx.destination)

    const step = durationMs / 1000 / frequencies.length
    frequencies.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(gain)
      const start = now + i * step
      osc.start(start)
      osc.stop(start + step + 0.02)
    })
  }

  beep() {
    if (!this.settings.beepEnabled) return
    this.tone([880], 120)
  }

  gong(final = false) {
    if (!this.settings.gongEnabled) return
    this.tone(final ? [523, 659, 784] : [392, 523], final ? 700 : 450, 0.22)
  }

  speak(text: string) {
    if (!this.settings.voiceEnabled) return
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel() // évite toute superposition/queue
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'fr-FR'
    if (this.frenchVoice) utterance.voice = this.frenchVoice
    utterance.rate = 1
    window.speechSynthesis.speak(utterance)
  }

  vibrate(pattern: number | number[]) {
    if (!this.settings.vibrationEnabled) return
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern)
  }

  announceGainage() {
    this.speak('Gainage')
  }

  announceCountIn(n: 3 | 2 | 1) {
    this.speak(String(n))
  }

  announceSessionComplete() {
    this.speak('Séance terminée')
  }

  /** Réinitialise le garde anti-doublon : à appeler à chaque début de série. */
  resetTickGuard() {
    this.lastTickKey = null
  }

  /**
   * Point d'entrée unique par tick de seconde entière. Ne déclenche jamais
   * deux fois le même événement pour un couple (elapsed, remaining) donné —
   * protège contre les re-déclenchements après pause/reprise ou re-render.
   */
  handleTick(elapsedSeconds: number, remainingSeconds: number) {
    const key = `${elapsedSeconds}:${remainingSeconds}`
    if (key === this.lastTickKey) return
    this.lastTickKey = key

    const event = getTickAudioEvent(elapsedSeconds, remainingSeconds)
    if (event === 'countdown') {
      this.speak(String(getCountdownDigit(remainingSeconds)))
      this.vibrate(15)
    } else if (event === 'beep') {
      this.beep()
    }
  }

  stopAll() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
  }
}
