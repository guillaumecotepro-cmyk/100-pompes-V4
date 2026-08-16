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
  const [countingMethod, setCountingMethod] = useState<JumpCountingMethod | null>(null)
  const [lastResult, setLastResult] = useState<SessionResult | null>(null)
  const previousBestSession = useRef(0)

  const jumpBridgeRef = useRef<JumpBridge>(() => {})
  const cameraActive = phase === 'method' || phase === 'runner'
  const camera = useCameraJumpCounter({ active: cameraActive, onJump: (_c, t) => jumpBridgeRef.current(t) })
  const motion = useMotionJumpCounter({ active: cameraActive, onJump: (_c, t) => jumpBridgeRef.current(t) })

  const pauseCounting = useCallback(() => { camera.pause(); motion.pause() }, [camera, motion])
  const resumeCounting = useCallback(() => { camera.resume(); motion.resume() }, [camera, motion])

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

  const back = () => {
    if (phase === 'runner') { handleAbandon(); return }
    router.push('/jumprope/start')
  }

  if (phase !== 'runner') {
    return (
      <div className="app-content-page bg-white flex flex-col">
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button onClick={back} className="p-2 rounded-xl hover:bg-gray-100">
            <ChevronLeft size={22} className="text-gray-500" />
          </button>
        </div>
        <div className="flex-1 px-5 pt-2 flex flex-col page-scroll-gutter">
          {phase === 'config' && <JumpConfigStep mode={mode as 'goal_jumps' | 'goal_duration' | 'intervals'} onConfirm={handleConfigConfirm} />}
          {phase === 'method' && (
            <CountingMethodPicker camera={camera} motion={motion} defaultMethod={jumprope.settings.preferredCountingMethod} onReady={handleMethodReady} />
          )}
          {phase === 'summary' && lastResult && (
            <SummaryScreen
              result={lastResult}
              isNewRecord={lastResult.totalJumps > previousBestSession.current}
              weightKg={jumprope.profile?.weightKg ?? null}
            />
          )}
        </div>
      </div>
    )
  }

  if (!blocks || !countingMethod) return null

  return (
    <div className="app-content-page bg-white flex flex-col px-4 pt-6">
      <JumpRopeSessionRunner
        mode={mode}
        blocks={blocks}
        countingMethod={countingMethod}
        jumpBridgeRef={jumpBridgeRef}
        pauseCounting={pauseCounting}
        resumeCounting={resumeCounting}
        audio={audio}
        announceEveryNJumps={jumprope.settings.announceEveryNJumps}
        announceHalfway={jumprope.settings.announceHalfway}
        onFinish={handleFinish}
        onAbandon={handleAbandon}
      />
    </div>
  )
}

function SummaryScreen({ result, isNewRecord, weightKg }: { result: SessionResult; isNewRecord: boolean; weightKg: number | null }) {
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
