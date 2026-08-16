'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, Lock, Unlock, Volume2, VolumeX, Plus, Minus, Square } from 'lucide-react'
import { usePlankTimer } from '@/hooks/plank/usePlankTimer'
import { useWakeLock } from '@/hooks/useWakeLock'
import { JumpRopeAudioEngine } from '@/lib/rope/audioEngine'
import { computeCadenceFromTimestamps } from '@/lib/rope/stats'
import { formatClock, formatJumps, formatCadence, COUNTING_METHOD_LABELS } from '@/lib/rope/format'
import { JumpCountingMethod, JumpSeries, JumpSessionMode } from '@/types/rope'
import { POSE_ALGORITHM_VERSION } from '@/lib/rope/poseCountingEngine'
import { MOTION_ALGORITHM_VERSION } from '@/lib/rope/motionCountingEngine'
import { cn } from '@/lib/utils'

export interface SessionBlock {
  type: 'warmup' | 'work' | 'rest' | 'cooldown'
  durationSeconds: number | null
  targetJumps: number | null
  label: string
}

export interface SessionResult {
  series: JumpSeries[]
  totalJumps: number
  activeDurationSeconds: number
  totalDurationSeconds: number
  avgCadence: number
  maxCadence: number
  bestStreak: number
  countingAlgorithmVersion: number
  status: 'completed' | 'interrupted'
}

export type JumpBridge = (timestamp: number) => void

interface JumpRopeSessionRunnerProps {
  mode: JumpSessionMode
  blocks: SessionBlock[]
  countingMethod: JumpCountingMethod
  /** Pont rempli par ce composant : le parent y redirige chaque saut détecté par la méthode active (caméra/mouvement). */
  jumpBridgeRef: React.MutableRefObject<JumpBridge>
  pauseCounting: () => void
  resumeCounting: () => void
  audio: JumpRopeAudioEngine
  announceEveryNJumps: 0 | 10 | 25 | 50 | 100
  announceHalfway: boolean
  /** Vrai quand un fond caméra plein écran est affiché derrière ce composant (méthode caméra) — bascule le style en clair-sur-sombre. */
  cameraActive: boolean
  onFinish: (result: SessionResult) => void
  onAbandon: () => void
}

const MIN_MANUAL_TAP_INTERVAL_MS = 250

export function JumpRopeSessionRunner({
  mode, blocks, countingMethod, jumpBridgeRef, pauseCounting, resumeCounting, audio, announceEveryNJumps, announceHalfway, cameraActive, onFinish, onAbandon,
}: JumpRopeSessionRunnerProps) {
  const [phase, setPhase] = useState<'countdown' | 'running' | 'paused' | 'finished'>('countdown')
  const [countdownValue, setCountdownValue] = useState<3 | 2 | 1 | 0>(3)
  const [blockIndex, setBlockIndex] = useState(0)
  const [jumpsThisBlock, setJumpsThisBlock] = useState(0)
  const [locked, setLocked] = useState(false)
  const [muted, setMuted] = useState(false)
  const [series, setSeries] = useState<JumpSeries[]>([])

  const jumpTimestampsRef = useRef<number[]>([])
  const blockStartRef = useRef(Date.now())
  const sessionStartRef = useRef(Date.now())
  const finishedRef = useRef(false)
  const isWorkBlockRef = useRef(false)
  const mutedRef = useRef(false)
  mutedRef.current = muted

  useWakeLock(phase === 'running' || phase === 'countdown')

  const currentBlock = blocks[blockIndex] ?? null
  const isWorkBlock = currentBlock?.type === 'work'
  isWorkBlockRef.current = phase === 'running' && isWorkBlock

  const timer = usePlankTimer({
    mode: currentBlock?.durationSeconds ? 'countdown' : 'stopwatch',
    targetSeconds: currentBlock?.durationSeconds ?? 0,
    running: phase === 'running',
    onTick: (elapsed, remaining) => {
      if (!mutedRef.current) audio.handleTick(elapsed, remaining)
    },
  })

  const speak = useCallback((fn: () => void) => { if (!mutedRef.current) fn() }, [])

  const finalizeBlockAndAdvance = useCallback((status: 'completed' | 'interrupted', finalJumps: number) => {
    const block = blocks[blockIndex]
    if (!block) return
    const elapsedSeconds = Math.max(0, Math.round((Date.now() - blockStartRef.current) / 1000))
    const { avgCadence, maxCadence } = computeCadenceFromTimestamps(jumpTimestampsRef.current)

    if (block.type === 'work') {
      setSeries(prev => [...prev, {
        order: prev.length,
        jumps: finalJumps,
        durationSeconds: elapsedSeconds,
        activeDurationSeconds: elapsedSeconds,
        avgCadence,
        maxCadence,
        bestStreak: finalJumps,
        status,
      }])
    }

    jumpTimestampsRef.current = []
    setJumpsThisBlock(0)
    audio.resetJumpMilestoneGuard()
    audio.resetTickGuard()

    const nextIndex = blockIndex + 1
    if (status === 'interrupted' || nextIndex >= blocks.length) {
      setPhase('finished')
      pauseCounting()
      return
    }

    setBlockIndex(nextIndex)
    blockStartRef.current = Date.now()
    const nextBlock = blocks[nextIndex]
    if (nextBlock.type === 'work') { speak(() => audio.announceWork()); resumeCounting() }
    else { speak(() => audio.announceRest()); pauseCounting() }
  }, [blocks, blockIndex, audio, pauseCounting, resumeCounting, speak])

  // Compte à rebours initial "3, 2, 1, partez".
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdownValue === 0) {
      speak(() => audio.announceGo())
      sessionStartRef.current = Date.now()
      blockStartRef.current = Date.now()
      setPhase('running')
      if (blocks[0]?.type === 'work') resumeCounting()
      else pauseCounting()
      return
    }
    speak(() => audio.announceCountIn(countdownValue))
    const t = setTimeout(() => setCountdownValue(v => (v - 1) as 2 | 1 | 0), 1000)
    return () => clearTimeout(t)
  }, [phase, countdownValue, audio, blocks, pauseCounting, resumeCounting, speak])

  // Fin de bloc par durée écoulée.
  useEffect(() => {
    if (phase === 'running' && currentBlock?.durationSeconds && timer.remainingSeconds === 0 && timer.elapsedSeconds > 0) {
      finalizeBlockAndAdvance('completed', jumpsThisBlock)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.remainingSeconds])

  // Fin de bloc par objectif de sauts atteint, et annonces (mi-parcours / tous les N sauts).
  useEffect(() => {
    if (phase !== 'running' || !isWorkBlock) return
    if (announceHalfway && currentBlock?.targetJumps && jumpsThisBlock === Math.floor(currentBlock.targetJumps / 2)) {
      speak(() => audio.announceHalfway())
    }
    if (jumpsThisBlock > 0) speak(() => audio.announceJumpMilestone(jumpsThisBlock, announceEveryNJumps))
    if (currentBlock?.targetJumps && jumpsThisBlock >= currentBlock.targetJumps) {
      finalizeBlockAndAdvance('completed', jumpsThisBlock)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpsThisBlock])

  // Pont : chaque saut détecté (caméra/mouvement) pendant un bloc de travail actif incrémente le compteur du bloc.
  useEffect(() => {
    jumpBridgeRef.current = (timestamp: number) => {
      if (!isWorkBlockRef.current) return
      jumpTimestampsRef.current.push(timestamp)
      setJumpsThisBlock(v => v + 1)
    }
    return () => { jumpBridgeRef.current = () => {} }
  }, [jumpBridgeRef])

  const lastManualTapRef = useRef(0)
  const tapManual = useCallback(() => {
    if (phase !== 'running' || !isWorkBlock) return
    const now = Date.now()
    if (now - lastManualTapRef.current < MIN_MANUAL_TAP_INTERVAL_MS) return
    lastManualTapRef.current = now
    jumpTimestampsRef.current.push(now)
    setJumpsThisBlock(v => v + 1)
  }, [phase, isWorkBlock])

  const correctLive = useCallback((delta: number) => {
    setJumpsThisBlock(v => Math.max(0, v + delta))
    if (delta > 0) jumpTimestampsRef.current.push(Date.now())
    else jumpTimestampsRef.current.pop()
  }, [])

  const togglePause = useCallback(() => {
    if (phase === 'running') {
      setPhase('paused')
      pauseCounting()
    } else if (phase === 'paused') {
      setPhase('running')
      if (isWorkBlock) resumeCounting()
    }
  }, [phase, isWorkBlock, pauseCounting, resumeCounting])

  const finishNow = useCallback(() => {
    if (phase === 'finished') return
    const status: 'completed' | 'interrupted' = currentBlock?.targetJumps && jumpsThisBlock < currentBlock.targetJumps ? 'interrupted' : 'completed'
    finalizeBlockAndAdvance(status, jumpsThisBlock)
  }, [phase, currentBlock, jumpsThisBlock, finalizeBlockAndAdvance])

  useEffect(() => {
    if (phase !== 'finished' || finishedRef.current) return
    finishedRef.current = true
    speak(() => audio.announceSessionComplete())
    const totalDurationSeconds = Math.max(0, Math.round((Date.now() - sessionStartRef.current) / 1000))
    const totalJumps = series.reduce((s, x) => s + x.jumps, 0)
    const activeDurationSeconds = series.reduce((s, x) => s + x.activeDurationSeconds, 0)
    const avgCadence = activeDurationSeconds > 0
      ? series.reduce((s, x) => s + x.avgCadence * x.activeDurationSeconds, 0) / activeDurationSeconds
      : 0
    const maxCadence = series.reduce((m, x) => Math.max(m, x.maxCadence), 0)
    const bestStreak = series.reduce((m, x) => Math.max(m, x.bestStreak), 0)

    onFinish({
      series, totalJumps, activeDurationSeconds, totalDurationSeconds,
      avgCadence: Math.round(avgCadence), maxCadence: Math.round(maxCadence), bestStreak,
      countingAlgorithmVersion: countingMethod === 'camera' ? POSE_ALGORITHM_VERSION : countingMethod === 'motion' ? MOTION_ALGORITHM_VERSION : 1,
      status: totalJumps > 0 || activeDurationSeconds > 0 ? 'completed' : 'interrupted',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const goalLabel = currentBlock?.targetJumps
    ? `${formatJumps(jumpsThisBlock)} / ${formatJumps(currentBlock.targetJumps)} sauts`
    : currentBlock?.durationSeconds
      ? formatClock(timer.remainingSeconds)
      : `${formatJumps(jumpsThisBlock)} sauts`

  if (phase === 'countdown') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className={cn('text-sm font-semibold uppercase tracking-wide', cameraActive ? 'text-white/80' : 'text-gray-500')}>Prépare-toi</p>
        <div key={countdownValue} className={cn('text-8xl font-black animate-bounce-in', cameraActive ? 'text-lime-400' : 'text-violet-600')}>
          {countdownValue === 0 ? 'GO' : countdownValue}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {locked ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className={cn('text-6xl font-black', cameraActive ? 'text-white/50' : 'text-gray-300')}>{formatJumps(jumpsThisBlock)}</p>
          <button onClick={() => setLocked(false)} className={cn('flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm', cameraActive ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-600')}>
            <Unlock size={16} /> Déverrouiller l&apos;écran
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-1">
            <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', cameraActive ? 'text-white bg-white/15' : 'text-violet-700 bg-violet-50')}>{currentBlock?.label ?? ''}</span>
            <span className={cn('text-xs', cameraActive ? 'text-white/70' : 'text-gray-400')}>{COUNTING_METHOD_LABELS[countingMethod]}</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <p className={cn('text-7xl font-black tabular-nums', cameraActive ? 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]' : 'text-gray-900')}>{formatJumps(jumpsThisBlock)}</p>
            <p className={cn('text-sm font-semibold', cameraActive ? 'text-white/85' : 'text-gray-500')}>{goalLabel}</p>
            {jumpTimestampsRef.current.length >= 2 && (
              <p className={cn('text-xs', cameraActive ? 'text-white/60' : 'text-gray-400')}>{formatCadence(computeCadenceFromTimestamps(jumpTimestampsRef.current).avgCadence)}</p>
            )}
            {mode !== 'free' && !currentBlock?.targetJumps && currentBlock?.durationSeconds && (
              <p className={cn('text-xs', cameraActive ? 'text-white/60' : 'text-gray-400')}>Temps écoulé : {formatClock(timer.elapsedSeconds)}</p>
            )}
          </div>

          {countingMethod === 'manual' && isWorkBlock && phase === 'running' && (
            <button
              onClick={tapManual}
              className="mx-4 mb-3 h-24 rounded-3xl bg-violet-600 text-white text-lg font-black shadow-lg shadow-violet-200 active:scale-95 transition-transform"
            >
              Tape à chaque saut
            </button>
          )}

          <div className="flex items-center justify-center gap-2 px-4 pb-2">
            <button onClick={() => correctLive(-1)} className={cn('w-10 h-10 rounded-full flex items-center justify-center', cameraActive ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-500')}><Minus size={16} /></button>
            <button onClick={() => correctLive(-5)} className={cn('px-2 h-10 rounded-full flex items-center justify-center text-xs font-bold', cameraActive ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-500')}>-5</button>
            <button onClick={() => correctLive(5)} className={cn('px-2 h-10 rounded-full flex items-center justify-center text-xs font-bold', cameraActive ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-500')}>+5</button>
            <button onClick={() => correctLive(1)} className={cn('w-10 h-10 rounded-full flex items-center justify-center', cameraActive ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-500')}><Plus size={16} /></button>
          </div>

          <div className="flex items-center gap-2 px-4 pb-4">
            <button onClick={() => setLocked(true)} className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', cameraActive ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-500')}>
              <Lock size={18} />
            </button>
            <button onClick={() => setMuted(m => !m)} className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', cameraActive ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-500')}>
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button onClick={togglePause} className="flex-1 h-12 rounded-2xl bg-violet-600 text-white font-bold flex items-center justify-center gap-2">
              {phase === 'paused' ? <><Play size={18} /> Reprendre</> : <><Pause size={18} /> Pause</>}
            </button>
            <button onClick={finishNow} className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white shrink-0">
              <Square size={16} fill="white" />
            </button>
          </div>
          {phase === 'paused' && (
            <button onClick={onAbandon} className={cn('mx-4 mb-4 text-xs font-semibold text-center', cameraActive ? 'text-red-300' : 'text-red-500')}>
              Abandonner la séance
            </button>
          )}
        </>
      )}
    </div>
  )
}
