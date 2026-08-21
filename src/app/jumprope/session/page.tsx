'use client'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, Trophy, Flame, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useJumpRopeData } from '@/hooks/rope/useJumpRopeData'
import { useJumpRopeAudio } from '@/hooks/rope/useJumpRopeAudio'
import { useCameraJumpCounter } from '@/hooks/rope/useCameraJumpCounter'
import { useMotionJumpCounter } from '@/hooks/rope/useMotionJumpCounter'
import { CountingMethodPicker } from '@/components/jumprope/CountingMethodPicker'
import { CameraBackground } from '@/components/jumprope/CameraBackground'
import { JumpConfigStep } from '@/components/jumprope/JumpConfigStep'
import { JumpRopeSessionRunner, SessionBlock, SessionResult, JumpBridge } from '@/components/jumprope/JumpRopeSessionRunner'
import { getJumpProgram } from '@/lib/rope/programs'
import { computeBestSessionJumps } from '@/lib/rope/stats'
import { estimateCalories } from '@/lib/rope/config'
import { formatClock, formatDurationHMS, formatJumps, formatCadence } from '@/lib/rope/format'
import { JumpCountingMethod, JumpSessionMode } from '@/types/rope'

type Phase = 'config' | 'method' | 'runner' | 'summary'

function SessionFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = (searchParams.get('mode') ?? 'free') as JumpSessionMode
  const workoutParam = searchParams.get('workout')
  const dayParam = searchParams.get('day')
  const targetJumpsParam = searchParams.get('targetJumps')
  const targetDurationParam = searchParams.get('targetDuration')

  const { hydrated, jumprope, recordSession } = useJumpRopeData()
  const audio = useJumpRopeAudio(jumprope.settings)

  const needsConfig = mode === 'goal_jumps' || mode === 'goal_duration' || mode === 'intervals'
  const [phase, setPhase] = useState<Phase>(needsConfig ? 'config' : 'method')
  const [blocks, setBlocks] = useState<SessionBlock[] | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<JumpCountingMethod | null>(null)
  const [countingMethod, setCountingMethod] = useState<JumpCountingMethod | null>(null)
  const [lastResult, setLastResult] = useState<SessionResult | null>(null)
  const [restartToken, setRestartToken] = useState(0)
  const previousBestSession = useRef(0)

  const jumpBridgeRef = useRef<JumpBridge>(() => {})
  const detectionActive = phase === 'method' || phase === 'runner'
  const camera = useCameraJumpCounter({ active: detectionActive, onJump: (_c, t) => jumpBridgeRef.current(t) })
  const motion = useMotionJumpCounter({ active: detectionActive, onJump: (_c, t) => jumpBridgeRef.current(t) })
  // Le fond caméra plein écran reste monté (donc la boucle de détection continue de recevoir des frames)
  // tant que la caméra est la méthode choisie, de l'écran de configuration jusqu'à la fin de la séance.
  const cameraBackgroundActive = selectedMethod === 'camera' && phase !== 'summary'

  // Dépend des fonctions stables (`camera.pause` etc., mémoïsées à vide dans leurs hooks respectifs) et
  // jamais des objets `camera`/`motion` eux-mêmes : ceux-ci changent d'identité à chaque frame de détection
  // (~60/s), ce qui casserait toute logique de timing en aval (ex. le décompte 3-2-1) dépendant de ces callbacks.
  const cameraPause = camera.pause
  const cameraResume = camera.resume
  const motionPause = motion.pause
  const motionResume = motion.resume
  const pauseCounting = useCallback(() => { cameraPause(); motionPause() }, [cameraPause, motionPause])
  const resumeCounting = useCallback(() => { cameraResume(); motionResume() }, [cameraResume, motionResume])

  // Résolution automatique des blocs pour les modes qui n'ont pas besoin d'étape de configuration.
  useEffect(() => {
    if (!hydrated || blocks !== null || needsConfig) return
    if (mode === 'program' && workoutParam != null && jumprope.activeProgramId) {
      const program = getJumpProgram(jumprope.activeProgramId)
      const workout = program.workouts[Number(workoutParam)]
      if (workout) { setBlocks(workout.blocks); return }
    }
    if (mode === 'challenge7' || mode === 'daily_challenge') {
      setBlocks([{
        type: 'work',
        durationSeconds: targetDurationParam ? Number(targetDurationParam) : null,
        targetJumps: targetJumpsParam ? Number(targetJumpsParam) : null,
        label: mode === 'challenge7' ? `Défi 7 jours — Jour ${dayParam}` : 'Défi du jour',
      }])
      return
    }
    setBlocks([{ type: 'work', durationSeconds: null, targetJumps: null, label: 'Séance libre' }])
  }, [hydrated, blocks, needsConfig, mode, workoutParam, dayParam, targetJumpsParam, targetDurationParam, jumprope.activeProgramId])

  // Pré-sélectionne la méthode préférée (réglages) une fois les données hydratées, sans jamais redemander la permission automatiquement.
  useEffect(() => {
    if (hydrated && selectedMethod === null) setSelectedMethod(jumprope.settings.preferredCountingMethod)
  }, [hydrated, selectedMethod, jumprope.settings.preferredCountingMethod])

  const handleConfigConfirm = useCallback((configuredBlocks: SessionBlock[]) => {
    setBlocks(configuredBlocks)
    setPhase('method')
  }, [])

  const handleMethodReady = useCallback((method: JumpCountingMethod) => {
    setCountingMethod(method)
    camera.reset()
    motion.reset()
    previousBestSession.current = computeBestSessionJumps(jumprope.sessions)
    setPhase('runner')
  }, [camera, motion, jumprope.sessions])

  const handleFinish = useCallback((result: SessionResult) => {
    if (!countingMethod) return
    recordSession({
      mode,
      startedAt: new Date(Date.now() - result.totalDurationSeconds * 1000).toISOString(),
      totalDurationSeconds: result.totalDurationSeconds,
      activeDurationSeconds: result.activeDurationSeconds,
      totalJumps: result.totalJumps,
      avgCadence: result.avgCadence,
      maxCadence: result.maxCadence,
      countingMethod,
      countingAlgorithmVersion: result.countingAlgorithmVersion,
      series: result.series,
      bestStreak: result.bestStreak,
      status: result.status,
      programWorkoutIndex: mode === 'program' && workoutParam != null ? Number(workoutParam) : null,
      challengeDay: mode === 'challenge7' && dayParam != null ? Number(dayParam) : null,
    })
    camera.stopStream()
    setLastResult(result)
    setPhase('summary')
  }, [countingMethod, mode, workoutParam, dayParam, recordSession, camera])

  const handleAbandon = useCallback(() => {
    if (!confirm('Abandonner la séance ? Rien ne sera enregistré.')) return
    camera.stopStream()
    router.push('/jumprope')
  }, [camera, router])

  const handleRestart = useCallback(() => {
    if (!countingMethod) return
    camera.reset()
    motion.reset()
    if (countingMethod === 'camera') void camera.requestPermission()
    previousBestSession.current = computeBestSessionJumps(jumprope.sessions)
    setRestartToken(t => t + 1)
    setPhase('runner')
  }, [countingMethod, camera, motion, jumprope.sessions])

  const back = () => {
    if (phase === 'runner') { handleAbandon(); return }
    router.push('/jumprope/start')
  }

  const cameraLive = cameraBackgroundActive && camera.permission === 'granted'

  if (phase !== 'runner') {
    return (
      <>
        <CameraBackground camera={camera} active={cameraBackgroundActive} />
        <div className="app-content-page flex flex-col" style={cameraLive ? { background: 'transparent' } : undefined}>
          <div className="relative z-10 flex items-center gap-3 px-4 pt-6 pb-4">
            <button onClick={back} className={`p-2 rounded-xl ${cameraLive ? 'bg-black/30 hover:bg-black/40' : 'hover:bg-gray-100'}`}>
              <ChevronLeft size={22} className={cameraLive ? 'text-white' : 'text-gray-500'} />
            </button>
          </div>
          <div className="relative z-10 flex-1 px-5 pt-2 flex flex-col page-scroll-gutter">
            {phase === 'config' && <JumpConfigStep mode={mode as 'goal_jumps' | 'goal_duration' | 'intervals'} onConfirm={handleConfigConfirm} />}
            {phase === 'method' && (
              <CountingMethodPicker camera={camera} motion={motion} selected={selectedMethod} onSelect={setSelectedMethod} onReady={handleMethodReady} />
            )}
            {phase === 'summary' && lastResult && (
              <SummaryScreen
                result={lastResult}
                isNewRecord={lastResult.totalJumps > previousBestSession.current}
                weightKg={jumprope.profile?.weightKg ?? null}
                showRestart={mode === 'free'}
                onRestart={handleRestart}
              />
            )}
          </div>
        </div>
      </>
    )
  }

  if (!blocks || !countingMethod) return null

  return (
    <>
      <CameraBackground camera={camera} active={cameraBackgroundActive} />
      <div className="app-content-page flex flex-col px-4 pt-6" style={cameraLive ? { background: 'transparent' } : undefined}>
        <div className="relative z-10 flex-1 flex flex-col">
          <JumpRopeSessionRunner
            key={restartToken}
            mode={mode}
            blocks={blocks}
            countingMethod={countingMethod}
            jumpBridgeRef={jumpBridgeRef}
            pauseCounting={pauseCounting}
            resumeCounting={resumeCounting}
            audio={audio}
            announceEveryNJumps={jumprope.settings.announceEveryNJumps}
            announceHalfway={jumprope.settings.announceHalfway}
            cameraActive={cameraLive}
            onFinish={handleFinish}
            onAbandon={handleAbandon}
          />
        </div>
      </div>
    </>
  )
}

function SummaryScreen({ result, isNewRecord, weightKg, showRestart, onRestart }: { result: SessionResult; isNewRecord: boolean; weightKg: number | null; showRestart: boolean; onRestart: () => void }) {
  const router = useRouter()
  const calories = estimateCalories(result.activeDurationSeconds, result.avgCadence, weightKg)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center text-center gap-2 py-4">
        <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
          <Trophy size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">Séance terminée !</h1>
        {isNewRecord && <p className="text-sm font-bold text-amber-600">🎉 Nouveau record personnel</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><Zap size={12} /> Sauts</p>
          <p className="text-2xl font-black text-gray-900">{formatJumps(result.totalJumps)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><Clock size={12} /> Durée active</p>
          <p className="text-2xl font-black text-gray-900">{formatDurationHMS(result.activeDurationSeconds)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-500">Cadence moyenne</p>
          <p className="text-lg font-black text-gray-900">{formatCadence(result.avgCadence)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><Flame size={12} /> Calories (est.)</p>
          <p className="text-lg font-black text-gray-900">{calories} kcal</p>
        </Card>
      </div>

      {result.series.length > 1 && (
        <Card className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-gray-500 mb-1">Détail par série</p>
          {result.series.map(s => (
            <div key={s.order} className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Série {s.order + 1}</span>
              <span className="font-semibold text-gray-800">{formatJumps(s.jumps)} sauts · {formatClock(s.durationSeconds)}</span>
            </div>
          ))}
        </Card>
      )}

      {showRestart && (
        <Button size="xl" fullWidth variant="secondary" className="bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:bg-emerald-700" onClick={onRestart}>Recommencer cette séance</Button>
      )}
      <Button size="xl" fullWidth onClick={() => router.push('/jumprope')}>Retour à l&apos;accueil</Button>
    </div>
  )
}

export default function JumpRopeSessionPage() {
  return (
    <Suspense>
      <SessionFlow />
    </Suspense>
  )
}
