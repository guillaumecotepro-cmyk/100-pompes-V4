import { MAX_PLAUSIBLE_CADENCE } from './config'

/**
 * Une frame de pose, déjà réduite à ce dont l'algorithme a besoin — la
 * couche caméra (MediaPipe) est responsable de calculer ces valeurs à
 * partir des landmarks réels (hanches/genoux/chevilles/épaules/bassin).
 * Ce découpage permet de tester tout le moteur sans caméra ni modèle de
 * vision, avec de simples séquences synthétiques.
 */
export interface PoseFrame {
  /** Timestamp en millisecondes (horloge monotone). */
  t: number
  /** Position verticale composite du corps, normalisée : plus petit = plus haut (en l'air), plus grand = plus bas (au sol). */
  verticalPosition: number
  /** Échelle du corps dans le cadre (ex. distance épaule-cheville normalisée) — sert à adapter les seuils à la taille/distance de l'utilisateur. */
  bodyScale: number
  /** Confiance de détection de la pose, 0 à 1. */
  confidence: number
  /** Le corps entier est-il visible dans le cadre ? */
  bodyVisible: boolean
  /** Vitesse latérale normalisée (0 = immobile) — sert à rejeter la marche. */
  lateralVelocity: number
  /** Amplitude de mouvement des bras seuls, normalisée — sert à rejeter les mouvements de bras sans saut. */
  armMovement: number
}

export type PoseCounterState = 'calibrating' | 'ground' | 'takeoff' | 'airborne' | 'landing' | 'paused' | 'lost'

export interface PoseCounterConfig {
  calibrationFrames: number
  minConfidence: number
  lostTimeoutMs: number
  minJumpIntervalMs: number
  maxLateralVelocity: number
  maxArmOnlyMovement: number
  takeoffThresholdFactor: number
  airborneThresholdFactor: number
  groundBandFactor: number
  smoothingAlpha: number
}

export const DEFAULT_POSE_COUNTER_CONFIG: PoseCounterConfig = {
  calibrationFrames: 15,
  minConfidence: 0.5,
  lostTimeoutMs: 800,
  minJumpIntervalMs: Math.ceil(60_000 / MAX_PLAUSIBLE_CADENCE),
  maxLateralVelocity: 0.35,
  maxArmOnlyMovement: 0.6,
  // Un saut à la corde ne décolle que de ~3 à 8 cm (contrairement à un grand saut vertical) : les
  // seuils doivent rester proportionnellement petits par rapport à bodyScale (hauteur épaules→chevilles
  // dans le cadre), sous peine de ne jamais détecter de sauts réels.
  takeoffThresholdFactor: 0.025,
  airborneThresholdFactor: 0.04,
  groundBandFactor: 0.015,
  smoothingAlpha: 0.85,
}

export const POSE_ALGORITHM_VERSION = 1

/**
 * Compteur de sauts par pose caméra — machine à états CALIBRATION → SOL →
 * IMPULSION → EN_L_AIR → ATTERRISSAGE → (retour SOL = 1 saut validé), avec
 * PAUSE et CORPS_PERDU. Un saut n'est compté qu'après un cycle complet,
 * avec hystérésis (bandes de seuil distinctes montée/descente) et
 * anti-rebond (intervalle minimal entre deux sauts).
 */
export class PoseJumpCounter {
  private config: PoseCounterConfig
  private state: PoseCounterState = 'calibrating'
  private calibrationSamples: { verticalPosition: number; bodyScale: number }[] = []
  private groundLevel = 0
  private bodyScale = 0.3
  private smoothed: number | null = null
  private lastJumpAt = -Infinity
  private lostSince: number | null = null
  private jumpTimestamps: number[] = []
  private pausedExternally = false

  constructor(config: Partial<PoseCounterConfig> = {}) {
    this.config = { ...DEFAULT_POSE_COUNTER_CONFIG, ...config }
  }

  get currentState(): PoseCounterState { return this.state }
  get jumpCount(): number { return this.jumpTimestamps.length }
  get jumps(): number[] { return [...this.jumpTimestamps] }

  pause(): void { this.pausedExternally = true; this.state = 'paused' }
  resume(): void { if (this.pausedExternally) { this.pausedExternally = false; this.state = 'ground' } }

  reset(): void {
    this.state = 'calibrating'
    this.calibrationSamples = []
    this.groundLevel = 0
    this.smoothed = null
    this.lastJumpAt = -Infinity
    this.lostSince = null
    this.jumpTimestamps = []
    this.pausedExternally = false
  }

  /** Traite une frame ; retourne le timestamp du saut si un saut vient d'être validé. */
  pushFrame(frame: PoseFrame): number | null {
    if (this.pausedExternally) return null

    if (!frame.bodyVisible || frame.confidence < this.config.minConfidence) {
      if (this.lostSince === null) this.lostSince = frame.t
      if (frame.t - this.lostSince >= this.config.lostTimeoutMs) this.state = 'lost'
      return null
    }
    const wasLost = this.state === 'lost'
    this.lostSince = null
    if (wasLost) this.state = 'ground' // récupération après occultation momentanée

    if (this.state === 'calibrating') {
      this.calibrationSamples.push({ verticalPosition: frame.verticalPosition, bodyScale: frame.bodyScale })
      if (this.calibrationSamples.length >= this.config.calibrationFrames) {
        const positions = this.calibrationSamples.map(s => s.verticalPosition).sort((a, b) => a - b)
        const scales = this.calibrationSamples.map(s => s.bodyScale).sort((a, b) => a - b)
        this.groundLevel = positions[Math.floor(positions.length / 2)]
        this.bodyScale = Math.max(0.05, scales[Math.floor(scales.length / 2)])
        this.smoothed = this.groundLevel
        this.state = 'ground'
      }
      return null
    }

    // Lissage temporel (moyenne mobile exponentielle) pour réduire le bruit frame-à-frame.
    this.smoothed = this.smoothed === null
      ? frame.verticalPosition
      : this.config.smoothingAlpha * frame.verticalPosition + (1 - this.config.smoothingAlpha) * this.smoothed
    const position = this.smoothed

    const takeoffThreshold = this.groundLevel - this.bodyScale * this.config.takeoffThresholdFactor
    const airborneThreshold = this.groundLevel - this.bodyScale * this.config.airborneThresholdFactor
    const groundBandUpperBound = this.groundLevel - this.bodyScale * this.config.groundBandFactor

    // Rejet marche (vitesse latérale) et mouvements de bras seuls.
    const plausibleMotion = frame.lateralVelocity <= this.config.maxLateralVelocity
      && frame.armMovement <= this.config.maxArmOnlyMovement

    const validateLanding = (): number | null => {
      const sinceLast = frame.t - this.lastJumpAt
      this.state = 'ground'
      if (sinceLast >= this.config.minJumpIntervalMs) {
        this.lastJumpAt = frame.t
        this.jumpTimestamps.push(frame.t)
        return frame.t
      }
      // Rebond trop rapide pour être physiologiquement plausible : ignoré (anti-rebond).
      return null
    }

    switch (this.state) {
      case 'ground':
        if (plausibleMotion && position <= takeoffThreshold) this.state = 'takeoff'
        break

      case 'takeoff':
        if (position <= airborneThreshold) {
          this.state = 'airborne'
        } else if (position > groundBandUpperBound) {
          // Redescendu avant d'atteindre l'altitude minimale : flexion simple, rejetée.
          this.state = 'ground'
        }
        break

      case 'airborne':
        // À cadence élevée / fréquence d'images limitée, la descente peut franchir
        // directement les deux seuils en une seule frame : on valide alors le saut
        // sans exiger un passage obligé par un état "landing" séparé.
        if (position >= groundBandUpperBound) {
          return validateLanding()
        } else if (position > takeoffThreshold) {
          this.state = 'landing'
        }
        break

      case 'landing':
        if (position >= groundBandUpperBound) {
          return validateLanding()
        }
        break
    }

    return null
  }
}

export interface PoseSimulationResult {
  jumpTimestamps: number[]
  finalState: PoseCounterState
}

/** Fait rejouer une séquence de frames dans un compteur neuf — pratique pour les tests. */
export function simulatePoseSequence(frames: PoseFrame[], config: Partial<PoseCounterConfig> = {}): PoseSimulationResult {
  const counter = new PoseJumpCounter(config)
  for (const frame of frames) counter.pushFrame(frame)
  return { jumpTimestamps: counter.jumps, finalState: counter.currentState }
}
