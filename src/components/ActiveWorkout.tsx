'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, Minus, X, Zap, ChevronRight } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Progress } from './ui/Progress'
import { TapZone } from './ui/TapZone'
import { SensorMode, ProgramSession, CompletedSet, WorkoutPhase, RhythmQuality } from '@/types'
import { usePushupCounter } from '@/hooks/usePushupCounter'
import { useVibration } from '@/hooks/useVibration'
import { formatDuration } from '@/lib/utils'
import { getRandomRestMessage } from '@/lib/motivation'

interface ActiveWorkoutProps {
  session: ProgramSession
  sensorMode: SensorMode
  onComplete: (sets: CompletedSet[], duration: number) => void
  onAbort: () => void
}

const RHYTHM_LABELS: Record<RhythmQuality, { label: string; color: string }> = {
  idle:  { label: 'Prêt',       color: 'text-gray-400' },
  good:  { label: 'Bon rythme', color: 'text-emerald-500' },
  fast:  { label: 'Rapide !',   color: 'text-brand-500' },
  slow:  { label: 'Lentement',  color: 'text-blue-500' },
}

export function ActiveWorkout({ session, sensorMode, onComplete, onAbort }: ActiveWorkoutProps) {
  const [phase, setPhase]           = useState<WorkoutPhase>('preparing')
  const [currentSet, setCurrentSet] = useState(0)
  const [completedSets, setCompletedSets] = useState<CompletedSet[]>([])
  const [restLeft, setRestLeft]     = useState(0)
  const [setStart, setSetStart]     = useState(0)
  const [pulseKey, setPulseKey]     = useState(0)
  const [restMsg]                   = useState(getRandomRestMessage)
  const [totalElapsed, setTotalElapsed] = useState(0)
  const workoutStart = useRef(Date.now())
  const totalTimer   = useRef<ReturnType<typeof setInterval>>()
  const restTimer    = useRef<ReturnType<typeof setInterval>>()

  const { vibrateRep, vibrateRest, vibrateComplete } = useVibration()

  const targetSet = session.sets[currentSet]
  const isLastSet = currentSet === session.sets.length - 1

  const handleRep = useCallback((count: number) => {
    setPulseKey(k => k + 1)
    vibrateRep()
    // Auto-complete set if target reached
    if (targetSet && count >= targetSet.reps) {
      finishSet(count)
    }
  }, [targetSet, vibrateRep])

  const { count, rhythmQuality, sensorReady, addRep, reset } =
    usePushupCounter({ mode: sensorMode, active: phase === 'active', onRep: handleRep })

  // Total elapsed timer
  useEffect(() => {
    totalTimer.current = setInterval(() => {
      setTotalElapsed(Math.floor((Date.now() - workoutStart.current) / 1000))
    }, 1000)
    return () => clearInterval(totalTimer.current)
  }, [])

  // Rest countdown
  useEffect(() => {
    if (phase !== 'resting') { clearInterval(restTimer.current); return }
    restTimer.current = setInterval(() => {
      setRestLeft(prev => {
        if (prev <= 1) {
          clearInterval(restTimer.current)
          startNextSet()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(restTimer.current)
  }, [phase, currentSet])

  function startSet() {
    reset()
    setSetStart(Date.now())
    setPhase('active')
  }

  function finishSet(finalCount?: number) {
    const reps = finalCount ?? count
    const duration = Math.round((Date.now() - setStart) / 1000)
    const completedSet: CompletedSet = {
      targetReps:    targetSet?.reps ?? 0,
      completedReps: reps,
      duration,
    }

    const newSets = [...completedSets, completedSet]
    setCompletedSets(newSets)

    if (isLastSet) {
      const totalDuration = Math.round((Date.now() - workoutStart.current) / 1000)
      vibrateComplete()
      setPhase('completed')
      onComplete(newSets, totalDuration)
    } else {
      const restSecs = targetSet?.restSeconds ?? 60
      setRestLeft(restSecs)
      vibrateRest()
      setPhase('resting')
    }
  }

  function startNextSet() {
    setCurrentSet(s => s + 1)
    setPhase('preparing')
  }

  function skipRest() {
    clearInterval(restTimer.current)
    startNextSet()
  }

  const totalTarget = session.sets.reduce((s, r) => s + r.reps, 0)
  const doneReps    = completedSets.reduce((s, r) => s + r.completedReps, 0)
  const progressPct = Math.round(((currentSet + (phase === 'completed' ? 1 : 0)) / session.sets.length) * 100)
  const rhythmInfo  = RHYTHM_LABELS[rhythmQuality]

  return (
    <div className="flex flex-col min-h-[calc(75dvh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400">Séance {session.index + 1} · Semaine {session.week}</p>
          <p className="font-semibold text-gray-800">{session.focus}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">{formatDuration(totalElapsed)}</p>
          <p className="text-sm font-medium text-gray-600">{doneReps + count}/{totalTarget}</p>
        </div>
      </div>

      <Progress value={progressPct} height="sm" className="mb-4" />

      {/* Set indicators */}
      <div className="flex gap-1.5 justify-center mb-5">
        {session.sets.map((s, i) => (
          <div key={i}
            className={`h-2 rounded-full flex-1 max-w-12 transition-colors ${
              i < currentSet ? 'bg-brand-500' :
              i === currentSet ? 'bg-brand-300' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Main area */}
      <AnimatePresence mode="wait">
        {phase === 'preparing' && (
          <motion.div key="prep" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-gray-500 text-sm">Série {currentSet + 1} / {session.sets.length}</p>
              <p className="text-5xl font-black text-gray-900 mt-1">{targetSet?.reps}</p>
              <p className="text-gray-500">pompes</p>
            </div>
            <Button size="xl" onClick={startSet} className="px-12">
              <Play size={20} /> Démarrer
            </Button>
          </motion.div>
        )}

        {phase === 'active' && (
          <motion.div key="active" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-4">

            {/* Rhythm indicator */}
            <p className={`text-sm font-medium ${rhythmInfo.color}`}>{rhythmInfo.label}</p>

            {/* Counter + tap zone */}
            {sensorMode === 'tap' ? (
              <TapZone onTap={addRep} pulseKey={pulseKey}>
                <div className="text-8xl font-black leading-none">{count}</div>
                <div className="text-sm font-medium mt-1 text-white/70">/ {targetSet?.reps}</div>
                <div className="absolute bottom-6 text-white/60 text-xs">TAPE ICI</div>
              </TapZone>
            ) : (
              <motion.button
                key={pulseKey}
                animate={pulseKey > 0 ? { scale: [1, 1.07, 1] } : {}}
                transition={{ duration: 0.25 }}
                className="relative rounded-full flex flex-col items-center justify-center select-none bg-brand-50 border-4 border-brand-200 w-52 h-52"
              >
                <div className="text-8xl font-black leading-none text-brand-600">{count}</div>
                <div className="text-sm font-medium mt-1 text-brand-400">/ {targetSet?.reps}</div>
              </motion.button>
            )}

            {sensorMode !== 'tap' && (
              <div className="flex items-center gap-2 bg-brand-50 rounded-full px-4 py-1.5">
                <Zap size={14} className="text-brand-500" />
                <span className="text-xs text-brand-700 font-medium">
                  {sensorMode === 'accelerometer' ? 'Capteur actif' : 
                   sensorMode === 'camera' ? 'Caméra active' :
                   'Proximité active'}
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" size="sm" onClick={() => addRep()}>
                +1 Manuel
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { /* noop, subtract handled separately */ }}>
                <Minus size={14} /> {count > 0 ? <span onClick={(e) => { e.stopPropagation() }} /> : null}
              </Button>
            </div>

            <div className="flex gap-3 w-full">
              <Button variant="secondary" size="md" className="flex-1" onClick={() => setPhase('paused')}>
                <Pause size={16} /> Pause
              </Button>
              <Button size="md" className="flex-1" onClick={() => finishSet()}>
                Terminer série <ChevronRight size={16} />
              </Button>
            </div>
          </motion.div>
        )}

        {phase === 'resting' && (
          <motion.div key="rest" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5">
            <p className="text-gray-500 text-sm font-medium">{restMsg}</p>
            <div className="w-36 h-36 rounded-full bg-blue-50 border-4 border-blue-200 flex flex-col items-center justify-center">
              <p className="text-5xl font-black text-blue-600">{restLeft}</p>
              <p className="text-sm text-blue-400">secondes</p>
            </div>
            <p className="text-sm text-gray-500">
              Prochain : {session.sets[currentSet + 1]?.reps ?? '—'} pompes
            </p>
            <Button variant="secondary" size="md" onClick={skipRest}>
              Passer le repos <ChevronRight size={16} />
            </Button>
          </motion.div>
        )}

        {phase === 'paused' && (
          <motion.div key="paused" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-4">
            <p className="text-2xl font-bold text-gray-700">En pause</p>
            <Button size="xl" onClick={() => setPhase('active')}>
              <Play size={20} /> Reprendre
            </Button>
            <Button variant="danger" size="md" onClick={onAbort}>
              <X size={16} /> Abandonner la séance
            </Button>
          </motion.div>
        )}

        {phase === 'completed' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <motion.div className="text-6xl" animate={{ rotate: [0, 15, -15, 0] }} transition={{ delay: 0.2 }}>
              🎉
            </motion.div>
            <p className="text-2xl font-bold text-gray-900">Séance terminée !</p>
            <p className="text-gray-500">
              {doneReps} pompes en {formatDuration(totalElapsed)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom abort */}
      {(phase === 'preparing' || phase === 'resting') && (
        <button onClick={onAbort} className="mt-4 text-center text-xs text-gray-400 py-2">
          Abandonner la séance
        </button>
      )}
    </div>
  )
}
