import { PoseFrame } from '../poseCountingEngine'

export interface NormalizedLandmark {
  x: number
  y: number
  visibility?: number
}

// Indices BlazePose (modèle utilisé par PoseLandmarker) pour les points nécessaires.
const LEFT_SHOULDER = 11
const RIGHT_SHOULDER = 12
const LEFT_HIP = 23
const RIGHT_HIP = 24
const LEFT_ANKLE = 27
const RIGHT_ANKLE = 28
const LEFT_WRIST = 15
const RIGHT_WRIST = 16

const MIN_LANDMARK_VISIBILITY = 0.5

function mid(a: NormalizedLandmark, b: NormalizedLandmark, key: 'x' | 'y'): number {
  return (a[key] + b[key]) / 2
}

function visibilityOf(l: NormalizedLandmark): number {
  return l.visibility ?? 1
}

export interface PreviousFrameState {
  hipX: number
  leftWristY: number
  rightWristY: number
}

/**
 * Convertit les landmarks bruts (une pose détectée par MediaPipe) en
 * `PoseFrame` exploitable par le moteur de comptage — seule cette
 * fonction connaît la structure MediaPipe, le moteur reste indépendant
 * de toute librairie de vision (et donc testable sans caméra).
 */
export function mapLandmarksToPoseFrame(
  landmarks: NormalizedLandmark[] | undefined,
  t: number,
  previous: PreviousFrameState | null
): { frame: PoseFrame; state: PreviousFrameState | null; feetVisible: boolean } {
  if (!landmarks || landmarks.length === 0) {
    return {
      frame: { t, verticalPosition: 0, bodyScale: 0.3, confidence: 0, bodyVisible: false, lateralVelocity: 0, armMovement: 0 },
      state: previous,
      feetVisible: false,
    }
  }

  const leftShoulder = landmarks[LEFT_SHOULDER]
  const rightShoulder = landmarks[RIGHT_SHOULDER]
  const leftHip = landmarks[LEFT_HIP]
  const rightHip = landmarks[RIGHT_HIP]
  const leftAnkle = landmarks[LEFT_ANKLE]
  const rightAnkle = landmarks[RIGHT_ANKLE]
  const leftWrist = landmarks[LEFT_WRIST]
  const rightWrist = landmarks[RIGHT_WRIST]

  const keyPoints = [leftShoulder, rightShoulder, leftHip, rightHip, leftAnkle, rightAnkle]
  const confidence = keyPoints.reduce((sum, p) => sum + visibilityOf(p), 0) / keyPoints.length
  const feetVisible = visibilityOf(leftAnkle) >= MIN_LANDMARK_VISIBILITY || visibilityOf(rightAnkle) >= MIN_LANDMARK_VISIBILITY
  const bodyVisible = confidence >= MIN_LANDMARK_VISIBILITY && feetVisible

  const shoulderY = mid(leftShoulder, rightShoulder, 'y')
  const hipY = mid(leftHip, rightHip, 'y')
  const ankleY = mid(leftAnkle, rightAnkle, 'y')
  const hipX = mid(leftHip, rightHip, 'x')

  // Centre de masse composite : hanches (poids fort) + épaules (poids faible), comme préconisé (§7).
  const verticalPosition = hipY * 0.7 + shoulderY * 0.3
  // Étendue verticale épaules→chevilles dans le cadre : sert à adapter les seuils à la distance/taille de l'utilisateur.
  const bodyScale = Math.max(0.05, ankleY - shoulderY)

  let lateralVelocity = 0
  let armMovement = 0
  if (previous) {
    lateralVelocity = Math.abs(hipX - previous.hipX) / bodyScale
    const leftWristDelta = Math.abs(leftWrist.y - previous.leftWristY)
    const rightWristDelta = Math.abs(rightWrist.y - previous.rightWristY)
    armMovement = Math.max(leftWristDelta, rightWristDelta) / bodyScale
  }

  return {
    frame: { t, verticalPosition, bodyScale, confidence, bodyVisible, lateralVelocity, armMovement },
    state: { hipX, leftWristY: leftWrist.y, rightWristY: rightWrist.y },
    feetVisible,
  }
}

export type FramingIssue = 'too_close' | 'too_far' | 'feet_not_visible' | 'low_confidence' | 'no_body' | null

/** Diagnostic de cadrage pour l'écran d'installation caméra — jamais une vraie mesure de lux, seulement des indices dérivés de la pose. */
export function diagnoseFraming(frame: PoseFrame, feetVisible: boolean): FramingIssue {
  if (frame.confidence === 0) return 'no_body'
  if (frame.bodyScale > 0.85) return 'too_close'
  if (frame.bodyScale < 0.22) return 'too_far'
  if (!feetVisible) return 'feet_not_visible'
  if (frame.confidence < 0.5) return 'low_confidence'
  return null
}
