'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Play, Square, Pause, ChevronRight, Minus, Volume2, VolumeX, Vibrate } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { usePushupCounter } from '@/hooks/usePushupCounter'
import { usePlankTimer } from '@/hooks/plank/usePlankTimer'
import { usePlankAudio } from '@/hooks/plank/usePlankAudio'
import { useWakeLock } from '@/hooks/useWakeLock'
import { formatClock } from '@/lib/plank/format'
import { PompesFreeMode, PompesFreeSet } from '@/types'
import { PlankSettings } from '@/types/plank'

const TIMER_PRESETS = [20, 30, 45, 60, 90]
const DEFAULT_REST_SECONDS = 60

type Phase = 'config' | 'prepare' | 'active' | 'resting' | 'confirm' | 'done'

export interface PompesFreeConfig {
  mode: PompesFreeMode
  targetSeconds: number
  targetReps: number
  setCount: number
  restSeconds: number
}

interface PompesFreeSessionRunnerProps {
  baseSettings: PlankSettings
  personalBest: number
  initialConfig?: PompesFreeConfig
  autoStart?: boolean
  onStarted: () => void
  onComplete: (mode: PompesFreeMode, restSeconds: number, sets: PompesFreeSet[], status: 'completed' | 'interrupted', config: PompesFreeConfig) => void
  onCancel: () => void
}

export function PompesFreeSessionRunner({ baseSettings, personalBest, initialConfig, autoStart, onStarted, onComplete, onCancel }: PompesFreeSessionRunnerProps) {
  const [phase, setPhase] = useState<Phase>('config')
  const [mode, setMode] = useState<PompesFreeMode>(initialConfig?.mode ?? 'timer')
  const [targetSeconds, setTargetSeconds] = useState(initialConfig?.targetSeconds ?? 30)
  const [customSeconds, setCustomSeconds] = useState('')
  const [targetReps, setTargetReps] = useState(initialConfig?.targetReps ?? 20)
  const [setCount, setSetCount] = useState(initialConfig?.setCount ?? 1)
  const [restSeconds, setRestSeconds] = useState(initialConfig?.restSeconds ?? DEFAULT_REST_SECONDS)
  const [localSettings, setLocalSettings] = useState<PlankSettings>(baseSettings)

  const [setIndex, setSetIndex] = useState(0)
  const [completedSets, setCompletedSets] = useState<PompesFreeSet[]>([])
  const [paused, setPaused] = useState(false)
  const [pulseKey, setPulseKey] = useState(0)
  const sessionStart = useRef(0)

  const engine = usePlankAudio(localSettings)
  useWakeLock(phase === 'prepare' || phase === 'active' || phase === 'resting')

  const prep = usePlankTimer({
    mode: 'countdown', targetSeconds: 3, running: phase === 'prepare',
    onTick: (_e, remaining) => { if (remaining >= 1 && remaining <= 3) engine.announceCountIn(remaining as 1 | 2 | 3) },
    onComplete: () => { engine.speak('Pompes'); engine.resetTickGuard(); setPhase('active') },
  })

  const timed = mode === 'timer'
  const hold = usePlankTimer({
    mode: timed ? 'countdown' : 'stopwatch',
    targetSeconds: timed ? targetSeconds : undefined,
    running: phase === 'active' && !paused,
    onTick: (elapsed, remaining) => {
      if (timed) engine.handleTick(elapsed, remaining)
      else if (elapsed > 0 && elapsed % 10 === 0) engine.beep()
    },
    onComplete: timed ? () => finishSet(count, 'completed') : undefined,
  })

  const rest = usePlankTimer({
    mode: 'countdown', targetSeconds: restSeconds, running: phase === 'resting',
    onComplete: () => goToNextSet(),
  })

  // Le compte de reps est passé explicitement à finishSet (jamais lu via une
  // closure) : handleRep est mémoïsé avec des dépendances volontairement
  // réduites (mode/targetReps ne changent pas en cours de série), donc toute
  // valeur lue par closure ailleurs qu'en paramètre serait figée sur le
  // premier rendu — bug réel détecté en test (compte toujours enregistré à 0).
  const handleRep = useCallback((count: number) => {
    setPulseKey(k => k + 1)
    engine.vibrate(15)
    if (mode === 'target' && count >= targetReps) finishSet(count, 'completed')
  }, [mode, targetReps]) // eslint-disable-line react-hooks/exhaustive-deps

  const { count, addRep, decrement, reset: resetCounter } = usePushupCounter({
    active: phase === 'active' && !paused,
    onRep: handleRep,
  })

  useEffect(() => {
    if (phase === 'prepare') prep.reset()
    if (phase === 'active') { hold.reset(); resetCounter(); setPaused(false) }
    if (phase === 'resting') rest.reset()
  }, [phase, setIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const isLastSet = setIndex === setCount - 1

  function finishSet(actualReps: number, status: 'completed' | 'interrupted') {
    const set: PompesFreeSet = {
      order: setIndex,
      mode,
      targetSeconds: mode === 'timer' ? targetSeconds : null,
      targetReps: mode === 'target' ? targetReps : null,
      actualReps,
      actualDurationSeconds: hold.elapsedSeconds,
      status,
    }
    const next = [...completedSets, set]
    setCompletedSets(next)
    engine.gong(isLastSet)
    engine.vibrate(status === 'completed' ? [80, 40, 80] : [50, 30, 50])

    if (isLastSet) {
      if (status === 'completed') engine.announceSessionComplete()
      setPhase('confirm')
    } else if (restSeconds > 0) {
      setPhase('resting')
    } else {
      goToNextSet()
    }
  }

  function goToNextSet() {
    setSetIndex(i => i + 1)
    setPhase('prepare')
  }

  const applyCustomSeconds = () => {
    const val = parseInt(customSeconds, 10)
    if (!isNaN(val) && val >= 10 && val <= 600) setTargetSeconds(val)
  }

  const start = () => {
    engine.resume()
    sessionStart.current = Date.now()
    setCompletedSets([])
    setSetIndex(0)
    onStarted()
    setPhase('prepare')
  }

  const abortSession = () => {
    onComplete(mode, restSeconds, completedSets, 'interrupted', { mode, targetSeconds, targetReps, setCount, restSeconds })
  }

  const confirmAndSave = () => {
    const allCompleted = completedSets.every(s => s.status === 'completed')
    onComplete(mode, restSeconds, completedSets, allCompleted ? 'completed' : 'interrupted', { mode, targetSeconds, targetReps, setCount, restSeconds })
    setPhase('done')
  }

  useEffect(() => {
    if (autoStart) start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalReps = completedSets.filter(s => s.status === 'completed').reduce((s, x) => s + x.actualReps, 0)

  return (
    <div className="flex flex-col h-full">
      {phase === 'config' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mode</p>
            <div className="flex flex-col gap-2">
              {([
                ['timer', 'Minuteur', 'Fais un max de pompes avant la fin du temps'],
                ['stopwatch', 'Chronomètre libre', 'Le temps défile, tu arrêtes quand tu veux'],
                ['target', 'Objectif de répétitions', 'Vise un nombre de pompes précis'],
              ] as [PompesFreeMode, string, string][]).map(([m, label, desc]) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`text-left px-4 py-3 rounded-2xl border-2 transition-all ${mode === m ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-white'}`}>
                  <p className={`text-sm font-bold ${mode === m ? 'text-brand-700' : 'text-gray-800'}`}>{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {mode === 'timer' && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Durée par série</p>
              <div className="flex flex-wrap gap-2">
                {TIMER_PRESETS.map(s => (
                  <button key={s} onClick={() => setTargetSeconds(s)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-bold border-2 ${targetSeconds === s ? 'border-brand-500 bg-brand-500 text-white' : 'border-gray-200 text-gray-700'}`}>
                    {s} s
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="number" inputMode="numeric" placeholder="secondes" value={customSeconds} onChange={e => setCustomSeconds(e.target.value)}
                  className="w-24 h-10 rounded-lg border-2 border-gray-200 px-2 text-sm font-semibold text-center" />
                <Button size="sm" variant="secondary" onClick={applyCustomSeconds}>Personnalisé</Button>
              </div>
            </div>
          )}

          {mode === 'target' && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Objectif de pompes</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setTargetReps(r => Math.max(1, r - 5))} className="w-10 h-10 rounded-full bg-gray-100 font-bold text-gray-600">-</button>
                <span className="text-xl font-black w-14 text-center">{targetReps}</span>
                <button onClick={() => setTargetReps(r => Math.min(200, r + 5))} className="w-10 h-10 rounded-full bg-gray-100 font-bold text-gray-600">+</button>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nombre de séries</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setSetCount(c => Math.max(1, c - 1))} className="w-10 h-10 rounded-full bg-gray-100 font-bold text-gray-600">-</button>
              <span className="text-xl font-black w-8 text-center">{setCount}</span>
              <button onClick={() => setSetCount(c => Math.min(10, c + 1))} className="w-10 h-10 rounded-full bg-gray-100 font-bold text-gray-600">+</button>
            </div>
          </div>

          {setCount > 1 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Repos entre les séries</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setRestSeconds(r => Math.max(5, r - 5))} className="w-10 h-10 rounded-full bg-gray-100 font-bold text-gray-600">-</button>
                <span className="text-xl font-black w-16 text-center">{restSeconds}s</span>
                <button onClick={() => setRestSeconds(r => Math.min(180, r + 5))} className="w-10 h-10 rounded-full bg-gray-100 font-bold text-gray-600">+</button>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Audio</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['voiceEnabled', 'Voix'], ['beepEnabled', 'Bips'], ['gongEnabled', 'Gong'], ['vibrationEnabled', 'Vibrations'],
              ] as const).map(([key, label]) => (
                <button key={key}
                  onClick={() => setLocalSettings(s => ({ ...s, [key]: !s[key] }))}
                  className={`flex items-center gap-2 h-11 rounded-xl text-sm font-semibold border-2 px-3 ${localSettings[key] ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-400'}`}>
                  {key === 'vibrationEnabled' ? <Vibrate size={16} /> : localSettings[key] ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {personalBest > 0 && (
            <Card className="bg-amber-50 border-amber-200">
              <p className="text-xs text-amber-700 font-medium">Record actuel : <span className="font-black">{personalBest}</span> pompes</p>
            </Card>
          )}

          <Button size="xl" fullWidth onClick={start}>
            <Play size={20} /> Démarrer <ChevronRight size={18} />
          </Button>
          <button onClick={onCancel} className="text-center text-xs text-gray-400 py-2">Annuler</button>
        </motion.div>
      )}

      {(phase === 'prepare' || phase === 'active') && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-brand-500 flex flex-col"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex justify-between items-center px-5 pt-4 pb-2">
            <p className="text-xs text-white/60">Série {setIndex + 1}/{setCount}</p>
            {phase === 'active' && mode === 'timer' && <p className="text-xs text-white/60 font-mono">{formatClock(hold.remainingSeconds)}</p>}
            {phase === 'active' && mode !== 'timer' && <p className="text-xs text-white/60 font-mono">{formatClock(hold.elapsedSeconds)}</p>}
          </div>

          {phase === 'prepare' ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[110px] font-black text-white leading-none tabular-nums">{Math.max(1, prep.remainingSeconds)}</p>
            </div>
          ) : (
            <motion.button
              key={pulseKey}
              animate={pulseKey > 0 ? { scale: [1, 1.015, 1] } : {}}
              transition={{ duration: 0.15 }}
              onTouchStart={(e) => { e.preventDefault(); addRep() }}
              onClick={addRep}
              className="flex-1 w-full bg-white/15 flex flex-col items-center justify-center select-none relative"
              style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
            >
              <div className="text-[100px] font-black leading-none text-white tabular-nums">{count}</div>
              <div className="text-white/50 text-base font-semibold mt-2">pompe{count !== 1 ? 's' : ''}{mode === 'target' ? ` / ${targetReps}` : ''}</div>
              <div className="absolute bottom-6 text-white/30 text-xs tracking-[0.3em] uppercase">{paused ? 'En pause' : 'Tape ici'}</div>
            </motion.button>
          )}

          {phase === 'active' && (
            <div className="flex gap-3 px-4 py-3">
              <button
                onClick={() => decrement()}
                disabled={count === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-white/20 text-white font-semibold text-sm rounded-2xl py-4 disabled:opacity-40"
              >
                <Minus size={18} /> Corriger
              </button>
              <button onClick={() => setPaused(p => !p)} className="flex-1 flex items-center justify-center gap-2 bg-white/20 text-white font-semibold text-sm rounded-2xl py-4">
                <Pause size={18} /> {paused ? 'Reprendre' : 'Pause'}
              </button>
              <button onClick={() => finishSet(count, 'completed')} className="flex-1 flex items-center justify-center gap-2 bg-white text-brand-600 font-semibold text-sm rounded-2xl py-4">
                <Square size={18} /> Terminer
              </button>
            </div>
          )}
          {paused && (
            <button onClick={abortSession} className="text-center text-xs text-white/60 py-3">Abandonner la séance</button>
          )}
        </motion.div>
      )}

      {phase === 'resting' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center gap-5">
          <p className="text-gray-500 text-sm font-medium">Repos</p>
          <div className="w-36 h-36 rounded-full bg-brand-50 border-4 border-brand-200 flex flex-col items-center justify-center">
            <p className="text-5xl font-black text-brand-600">{rest.remainingSeconds}</p>
            <p className="text-sm text-brand-400">secondes</p>
          </div>
          <Button variant="secondary" size="md" onClick={goToNextSet}>Passer le repos <ChevronRight size={16} /></Button>
          <button onClick={abortSession} className="text-center text-xs text-gray-400 py-2">Abandonner la séance</button>
        </motion.div>
      )}

      {phase === 'confirm' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
          <p className="text-2xl font-bold text-gray-900">Séance terminée</p>
          <Card className="w-full max-w-xs bg-gray-50">
            <p className="text-sm text-gray-600">{totalReps} pompe{totalReps !== 1 ? 's' : ''} au total, {completedSets.length} série{completedSets.length > 1 ? 's' : ''}.</p>
          </Card>
          <Button size="xl" onClick={confirmAndSave}>Confirmer et enregistrer</Button>
        </motion.div>
      )}
    </div>
  )
}
