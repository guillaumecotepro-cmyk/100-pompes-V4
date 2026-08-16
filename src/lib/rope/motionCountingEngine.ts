import { MAX_PLAUSIBLE_CADENCE } from './config'

/**
 * Comptage par capteurs de mouvement — pour un téléphone tenu en main ou
 * porté en brassard pendant le saut (jamais posé au sol : un téléphone au
 * sol ne peut pas mesurer le mouvement du corps). Détection de pics sur la
 * magnitude de l'accéléromètre, avec hystérésis (déclencheur de Schmitt)
 * pour éviter les doubles détections sur un même saut.
 */
export interface MotionSample {
  /** Timestamp en millisecondes (horloge monotone). */
  t: number
  /** Magnitude de l'accélération (m/s²), gravité incluse (~9.8 au repos). */
  magnitude: number
}

export interface MotionCounterConfig {
  calibrationSamples: number
  baselineAdaptAlpha: number
  /** En dessous de cette déviation, le signal est considéré "stable" : seul ce cas fait dériver le niveau de repos. */
  stabilityThreshold: number
  highThreshold: number
  lowThreshold: number
  minJumpIntervalMs: number
}

export const DEFAULT_MOTION_COUNTER_CONFIG: MotionCounterConfig = {
  calibrationSamples: 20,
  baselineAdaptAlpha: 0.05,
  stabilityThreshold: 0.5,
  highThreshold: 3.0,
  lowThreshold: 1.4,
  minJumpIntervalMs: Math.ceil(60_000 / MAX_PLAUSIBLE_CADENCE),
}

export const MOTION_ALGORITHM_VERSION = 1

export class MotionJumpCounter {
  private config: MotionCounterConfig
  private baseline: number | null = null
  private calibSamples: number[] = []
  private state: 'idle' | 'above' = 'idle'
  private lastJumpAt = -Infinity
  private jumpTimestamps: number[] = []
  private paused = false

  constructor(config: Partial<MotionCounterConfig> = {}) {
    this.config = { ...DEFAULT_MOTION_COUNTER_CONFIG, ...config }
  }

  get jumpCount(): number { return this.jumpTimestamps.length }
  get jumps(): number[] { return [...this.jumpTimestamps] }
  get calibrated(): boolean { return this.baseline !== null }

  pause(): void { this.paused = true }
  resume(): void { this.paused = false }

  reset(): void {
    this.baseline = null
    this.calibSamples = []
    this.state = 'idle'
    this.lastJumpAt = -Infinity
    this.jumpTimestamps = []
    this.paused = false
  }

  pushSample(sample: MotionSample): number | null {
    if (this.paused) return null

    if (this.baseline === null) {
      this.calibSamples.push(sample.magnitude)
      if (this.calibSamples.length >= this.config.calibrationSamples) {
        const sorted = [...this.calibSamples].sort((a, b) => a - b)
        this.baseline = sorted[Math.floor(sorted.length / 2)]
      }
      return null
    }

    const deviation = Math.abs(sample.magnitude - this.baseline)

    if (this.state === 'idle') {
      if (deviation >= this.config.highThreshold) {
        this.state = 'above'
      } else if (deviation < this.config.stabilityThreshold) {
        // Dérive lente du niveau de repos (ex. léger changement d'orientation du téléphone) —
        // uniquement adaptée quand le signal est vraiment stable, jamais pendant la montée
        // d'un saut (sinon la ligne de base "poursuivrait" le pic et l'absorberait).
        this.baseline = this.config.baselineAdaptAlpha * sample.magnitude + (1 - this.config.baselineAdaptAlpha) * this.baseline
      }
      return null
    }

    // state === 'above'
    if (deviation < this.config.lowThreshold) {
      this.state = 'idle'
      const sinceLast = sample.t - this.lastJumpAt
      if (sinceLast >= this.config.minJumpIntervalMs) {
        this.lastJumpAt = sample.t
        this.jumpTimestamps.push(sample.t)
        return sample.t
      }
      // Rebond trop rapide pour être physiologiquement plausible : ignoré.
    }
    return null
  }
}

export interface MotionSimulationResult {
  jumpTimestamps: number[]
}

export function simulateMotionSequence(samples: MotionSample[], config: Partial<MotionCounterConfig> = {}): MotionSimulationResult {
  const counter = new MotionJumpCounter(config)
  for (const s of samples) counter.pushSample(s)
  return { jumpTimestamps: counter.jumps }
}
