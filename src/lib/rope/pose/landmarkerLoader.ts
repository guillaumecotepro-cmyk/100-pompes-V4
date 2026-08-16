import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'

/**
 * Charge le modèle de détection de pose depuis les fichiers hébergés
 * localement (public/mediapipe) — jamais depuis un CDN tiers. Une fois
 * ce chargement effectué, toute l'inférence tourne dans le navigateur,
 * sans aucun appel réseau ni envoi d'image/vidéo vers un serveur.
 */
let landmarkerPromise: Promise<PoseLandmarker> | null = null

async function createLandmarker(delegate: 'GPU' | 'CPU'): Promise<PoseLandmarker> {
  const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '/mediapipe/models/pose_landmarker_lite.task',
      delegate,
    },
    runningMode: 'VIDEO',
    numPoses: 1,
  })
}

export function loadPoseLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = createLandmarker('GPU').catch(() => createLandmarker('CPU')).catch(err => {
      landmarkerPromise = null // permet une nouvelle tentative si l'appelant relance plus tard
      throw err
    })
  }
  return landmarkerPromise
}
