import { JumpRopeSettings } from '@/types/rope'
import { getTickAudioEvent, getCountdownDigit } from '../plank/audioSchedule'

/**
 * Moteur audio du module Corde à sauter — même architecture que
 * `PlankAudioEngine` (voix française via Web Speech API, bips/gong
 * synthétisés en Web Audio, aucun fichier son embarqué, 100% hors-ligne),
 * étendue avec les annonces propres à la corde à sauter (transitions
 * travail/repos, tous les N sauts, mi-parcours, objectif atteint, record).
 */
export class JumpRopeAudioEngine {
  private ctx: AudioContext | null = null
  private settings: JumpRopeSettings
  private frenchVoice: SpeechSynthesisVoice | null = null
  private lastTickKey: string | null = null
  private lastAnnouncedJumpMultiple = 0

  constructor(settings: JumpRopeSettings) {
    this.settings = settings
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadFrenchVoice()
      window.speechSynthesis.addEventListener('voiceschanged', () => this.loadFrenchVoice())
    }
  }

  updateSettings(settings: JumpRopeSettings) {
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

  /** Fanfare courte, distincte du gong de fin de séance — pour objectif atteint / record personnel. */
  chime() {
    if (!this.settings.gongEnabled) return
    this.tone([659, 784, 988], 500, 0.22)
  }

  speak(text: string) {
    if (!this.settings.voiceEnabled) return
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
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

  announceCountIn(n: 3 | 2 | 1) {
    this.speak(String(n))
  }

  announceGo() {
    this.speak('Partez')
    this.vibrate(30)
  }

  announceWork() {
    this.speak('Travail')
    this.beep()
  }

  announceRest() {
    this.speak('Repos')
    this.beep()
  }

  announceSessionComplete() {
    this.speak('Séance terminée')
  }

  announceGoalReached() {
    this.speak('Objectif atteint, bravo !')
    this.chime()
    this.vibrate([40, 60, 40])
  }

  announcePersonalRecord() {
    this.speak('Nouveau record personnel !')
    this.chime()
    this.vibrate([40, 60, 40, 60, 40])
  }

  announceHalfway() {
    this.speak('Mi-parcours')
  }

  /** Annonce le nombre de sauts atteint, sans jamais annoncer deux fois le même palier (garde interne). */
  announceJumpMilestone(count: number, everyN: JumpRopeSettings['announceEveryNJumps']) {
    if (everyN === 0) return
    const multiple = Math.floor(count / everyN)
    if (multiple === 0 || multiple === this.lastAnnouncedJumpMultiple) return
    this.lastAnnouncedJumpMultiple = multiple
    this.speak(String(multiple * everyN))
  }

  resetJumpMilestoneGuard() {
    this.lastAnnouncedJumpMultiple = 0
  }

  /** Réinitialise le garde anti-doublon du décompte : à appeler à chaque début de bloc chronométré. */
  resetTickGuard() {
    this.lastTickKey = null
  }

  /** Point d'entrée par tick de seconde entière pour le décompte final des 10 dernières secondes d'un bloc chronométré. */
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
