'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { PlankProgramSession, PlankSet, PlankDifficultyFeedback, PlankVariant, PlankSettings } from '@/types/plank'
import { usePlankTimer } from '@/hooks/plank/usePlankTimer'
import { usePlankAudio } from '@/hooks/plank/usePlankAudio'
import { useWakeLock } from '@/hooks/useWakeLock'
import { formatClock, formatPlankGoal } from '@/lib/plank/format'

type Phase = 'ready' | 'prepare' | 'active' | 'resting' | 'feedback' | 'done'

interface PlankSessionRunnerProps {
  session: PlankProgramSession
  settings: PlankSettings
  variant?: PlankVariant
  title: string
  onStarted: () => void
  onComplete: (sets: PlankSet[], durationSeconds: number, status: 'completed' | 'interrupted', feedback: PlankDifficultyFeedback | null) => void
  onCancel: () => void
}

export function PlankSessionRunner({ session, settings, variant = 'forearm', title, onStarted, onComplete, onCancel }: PlankSessionRunnerProps) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [setIndex, setSetIndex] = useState(0)
  const [completedSets, setCompletedSets] = useState<PlankSet[]>([])
  const [paused, setPaused] = useState(false)
  const sessionStart = useRef(0)

  const engine = usePlankAudio(settings)
  useWakeLock(phase === 'prepare' || phase === 'active' || phase === 'resting')

  const currentSet = session.sets[setIndex]
  const isLastSet = setIndex === session.sets.length - 1

  const prep = usePlankTimer({
    mode: 'countdown',
    targetSeconds: 3,
    running: phase === 'prepare',
    onTick: (_e, remaining) => { if (remaining >= 1 && remaining <= 3) engine.announceCountIn(remaining as 1 | 2 | 3) },
    onComplete: () => { engine.announceGainage(); engine.resetTickGuard(); setPhase('active') },
  })

  const hold = usePlankTimer({
    mode: 'countdown',
    targetSeconds: currentSet?.targetSeconds ?? 0,
    running: phase === 'active' && !paused,
    onTick: (elapsed, remaining) => engine.handleTick(elapsed, remaining),
    onComplete: () => finishSet(currentSet?.targetSeconds ?? 0, 'completed'),
  })

  const rest = usePlankTimer({
    mode: 'countdown',
    targetSeconds: currentSet?.restSeconds ?? 0,
    running: phase === 'resting',
    onComplete: () => goToNextSet(),
  })

  useEffect(() => {
    if (phase === 'prepare') prep.reset()
    if (phase === 'active') { hold.reset(); setPaused(false) }
    if (phase === 'resting') rest.reset()
  }, [phase, setIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const finishSet = useCallback((actualSeconds: number, status: 'completed' | 'interrupted') => {
    const set: PlankSet = { order: setIndex, variant, targetSeconds: currentSet?.targetSeconds ?? 0, actualSeconds, status }
    const next = [...completedSets, set]
    setCompletedSets(next)

    engine.gong(isLastSet)
    engine.vibrate(status === 'completed' ? [80, 40, 80] : [50, 30, 50])

    if (isLastSet) {
      if (status === 'completed') engine.announceSessionComplete()
      setPhase('feedback')
    } else if (currentSet && currentSet.restSeconds > 0) {
      setPhase('resting')
    } else {
      goToNextSet()
    }
  }, [completedSets, currentSet, engine, isLastSet, setIndex, variant]) // eslint-disable-line react-hooks/exhaustive-deps

  function goToNextSet() {
    setSetIndex(i => i + 1)
    setPhase('prepare')
  }

  const start = () => {
    engine.resume()
    sessionStart.current = Date.now()
    onStarted()
    setPhase('prepare')
  }

  const stopSetEarly = () => finishSet(hold.elapsedSeconds, 'interrupted')

  const abortSession = () => {
    const durationSeconds = sessionStart.current ? Math.round((Date.now() - sessionStart.current) / 1000) : 0
    onComplete(completedSets, durationSeconds, 'interrupted', null)
  }

  const submitFeedback = (feedback: PlankDifficultyFeedback) => {
    const durationSeconds = Math.round((Date.now() - sessionStart.current) / 1000)
    const allCompleted = completedSets.every(s => s.status === 'completed')
    onComplete(completedSets, durationSeconds, allCompleted ? 'completed' : 'interrupted', feedback)
    setPhase('done')
  }

  const totalSets = session.sets.length

  return (
    <div className="flex flex-col h-full">
      {phase === 'ready' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
          <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-4xl font-black text-gray-900 mt-1">{totalSets} série{totalSets > 1 ? 's' : ''}</p>
            <p className="text-gray-500 mt-1">
              {session.sets.map(s => formatPlankGoal(s.targetSeconds)).join(' · ')}
            </p>
          </div>
          <Button size="xl" onClick={start} className="px-12">
            <Play size={20} /> Démarrer
          </Button>
        </motion.div>
      )}

      {(phase === 'prepare' || phase === 'active') && (
        <motion.div
          key="active"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-teal-700 flex flex-col"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex justify-between items-center px-5 pt-4 pb-2">
            <p className="text-xs text-white/60">Série {setIndex + 1}/{totalSets}</p>
            <p className="text-xs text-white/60">{title}</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            {phase === 'prepare' ? (
              <p className="text-[110px] font-black text-white leading-none tabular-nums">{Math.max(1, prep.remainingSeconds)}</p>
            ) : (
              <>
                <p className="text-[90px] font-black text-white leading-none tabular-nums">{formatClock(hold.remainingSeconds)}</p>
                <Progress
                  value={currentSet ? ((currentSet.targetSeconds - hold.remainingSeconds) / currentSet.targetSeconds) * 100 : 0}
                  height="md" color="bg-white" className="w-48"
                />
                {paused && <p className="text-white/80 font-semibold mt-2">En pause</p>}
              </>
            )}
          </div>

          {phase === 'active' && (
            <div className="flex gap-3 px-4 py-4">
              <button
                onClick={() => setPaused(p => !p)}
                className="flex-1 flex items-center justify-center gap-2 bg-white/20 text-white font-semibold text-sm rounded-2xl py-4"
              >
                <Pause size={18} /> {paused ? 'Reprendre' : 'Pause'}
              </button>
              <button
                onClick={stopSetEarly}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-teal-700 font-semibold text-sm rounded-2xl py-4"
              >
                Je ne tiens plus
              </button>
            </div>
          )}
          {paused && (
            <button onClick={abortSession} className="text-center text-xs text-white/60 py-3">
              Abandonner la séance
            </button>
          )}
        </motion.div>
      )}

      {phase === 'resting' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center gap-5">
          <p className="text-gray-500 text-sm font-medium">Repos</p>
          <div className="w-36 h-36 rounded-full bg-teal-50 border-4 border-teal-200 flex flex-col items-center justify-center">
            <p className="text-5xl font-black text-teal-700">{rest.remainingSeconds}</p>
            <p className="text-sm text-teal-500">secondes</p>
          </div>
          <p className="text-sm text-gray-500">
            Prochaine série : {formatPlankGoal(session.sets[setIndex + 1]?.targetSeconds ?? 0)}
          </p>
          <Button variant="secondary" size="md" onClick={goToNextSet}>
            Passer le repos <ChevronRight size={16} />
          </Button>
          <button onClick={abortSession} className="text-center text-xs text-gray-400 py-2">
            Abandonner la séance
          </button>
        </motion.div>
      )}

      {phase === 'feedback' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
          <p className="text-2xl font-bold text-gray-900">Séance terminée !</p>
          <p className="text-gray-500">Comment as-tu trouvé cette séance ?</p>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <Button variant="secondary" fullWidth onClick={() => submitFeedback('easy')}>Trop facile</Button>
            <Button fullWidth onClick={() => submitFeedback('ok')}>Correcte</Button>
            <Button variant="secondary" fullWidth onClick={() => submitFeedback('hard')}>Trop difficile</Button>
          </div>
        </motion.div>
      )}

      {(phase === 'ready') && (
        <button onClick={onCancel} className="mt-4 text-center text-xs text-gray-400 py-2">
          Retour
        </button>
      )}
    </div>
  )
}
