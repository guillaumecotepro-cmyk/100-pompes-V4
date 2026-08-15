'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, Pause, ChevronRight, Volume2, VolumeX, Vibrate } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PlankSet, PlankVariant, PlankSettings, PlankTimerMode } from '@/types/plank'
import { usePlankTimer } from '@/hooks/plank/usePlankTimer'
import { usePlankAudio } from '@/hooks/plank/usePlankAudio'
import { useWakeLock } from '@/hooks/useWakeLock'
import { formatClock, formatPlankGoal, parseMinutesSecondsInput } from '@/lib/plank/format'
import { PLANK_GOAL_PRESETS_SECONDS, CUSTOM_GOAL_MIN_SECONDS, CUSTOM_GOAL_MAX_SECONDS, DEFAULT_REST_SECONDS } from '@/lib/plank/config'

const VARIANT_LABELS: Record<PlankVariant, string> = {
  forearm: 'Planche avant-bras',
  high: 'Planche haute',
  'side-left': 'Planche latérale gauche',
  'side-right': 'Planche latérale droite',
}

type Phase = 'config' | 'prepare' | 'active' | 'resting' | 'confirm' | 'done'

interface FreeSessionRunnerProps {
  baseSettings: PlankSettings
  onStarted: () => void
  onComplete: (sets: PlankSet[], durationSeconds: number, restSeconds: number, status: 'completed' | 'interrupted') => void
  onCancel: () => void
}

export function FreeSessionRunner({ baseSettings, onStarted, onComplete, onCancel }: FreeSessionRunnerProps) {
  const [phase, setPhase] = useState<Phase>('config')
  const [timerMode, setTimerMode] = useState<PlankTimerMode>('countdown')
  const [targetSeconds, setTargetSeconds] = useState<number>(45)
  const [customMin, setCustomMin] = useState('')
  const [customSec, setCustomSec] = useState('')
  const [setCount, setSetCount] = useState(1)
  const [restSeconds, setRestSeconds] = useState(DEFAULT_REST_SECONDS)
  const [variant, setVariant] = useState<PlankVariant>('forearm')
  const [localSettings, setLocalSettings] = useState<PlankSettings>(baseSettings)

  const [setIndex, setSetIndex] = useState(0)
  const [completedSets, setCompletedSets] = useState<PlankSet[]>([])
  const [paused, setPaused] = useState(false)
  const sessionStart = useRef(0)

  const engine = usePlankAudio(localSettings)
  useWakeLock(phase === 'prepare' || phase === 'active' || phase === 'resting')

  const prep = usePlankTimer({
    mode: 'countdown', targetSeconds: 3, running: phase === 'prepare',
    onTick: (_e, remaining) => { if (remaining >= 1 && remaining <= 3) engine.announceCountIn(remaining as 1 | 2 | 3) },
    onComplete: () => { engine.announceGainage(); engine.resetTickGuard(); setPhase('active') },
  })

  const hold = usePlankTimer({
    mode: timerMode === 'countdown' ? 'countdown' : 'stopwatch',
    targetSeconds: timerMode === 'countdown' ? targetSeconds : undefined,
    running: phase === 'active' && !paused,
    onTick: (elapsed, remaining) => {
      if (timerMode === 'countdown') engine.handleTick(elapsed, remaining)
      else if (elapsed > 0 && elapsed % 10 === 0) engine.beep()
    },
    onComplete: timerMode === 'countdown' ? () => finishSet(targetSeconds, 'completed') : undefined,
  })

  const rest = usePlankTimer({
    mode: 'countdown', targetSeconds: restSeconds, running: phase === 'resting',
    onComplete: () => goToNextSet(),
  })

  useEffect(() => {
    if (phase === 'prepare') prep.reset()
    if (phase === 'active') { hold.reset(); setPaused(false) }
    if (phase === 'resting') rest.reset()
  }, [phase, setIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const isLastSet = setIndex === setCount - 1

  const finishSet = useCallback((actualSeconds: number, status: 'completed' | 'interrupted') => {
    const set: PlankSet = { order: setIndex, variant, targetSeconds: timerMode === 'countdown' ? targetSeconds : actualSeconds, actualSeconds, status }
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
  }, [completedSets, engine, isLastSet, restSeconds, setIndex, targetSeconds, timerMode, variant]) // eslint-disable-line react-hooks/exhaustive-deps

  function goToNextSet() {
    setSetIndex(i => i + 1)
    setPhase('prepare')
  }

  const applyCustom = () => {
    const seconds = parseMinutesSecondsInput(customMin, customSec)
    if (seconds != null && seconds >= CUSTOM_GOAL_MIN_SECONDS && seconds <= CUSTOM_GOAL_MAX_SECONDS) setTargetSeconds(seconds)
  }

  const start = () => {
    engine.resume()
    sessionStart.current = Date.now()
    setCompletedSets([])
    setSetIndex(0)
    onStarted()
    setPhase('prepare')
  }

  const stopSetEarly = () => finishSet(hold.elapsedSeconds, 'interrupted')

  const abortSession = () => {
    const durationSeconds = sessionStart.current ? Math.round((Date.now() - sessionStart.current) / 1000) : 0
    onComplete(completedSets, durationSeconds, restSeconds, 'interrupted')
  }

  const confirmAndSave = () => {
    const durationSeconds = Math.round((Date.now() - sessionStart.current) / 1000)
    const allCompleted = completedSets.every(s => s.status === 'completed')
    onComplete(completedSets, durationSeconds, restSeconds, allCompleted ? 'completed' : 'interrupted')
    setPhase('done')
  }

  return (
    <div className="flex flex-col h-full">
      {phase === 'config' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mode</p>
            <div className="flex gap-2">
              <button onClick={() => setTimerMode('countdown')}
                className={`flex-1 h-11 rounded-xl text-sm font-bold border-2 ${timerMode === 'countdown' ? 'border-teal-600 bg-teal-600 text-white' : 'border-gray-200 text-gray-600'}`}>
                Minuteur
              </button>
              <button onClick={() => setTimerMode('stopwatch')}
                className={`flex-1 h-11 rounded-xl text-sm font-bold border-2 ${timerMode === 'stopwatch' ? 'border-teal-600 bg-teal-600 text-white' : 'border-gray-200 text-gray-600'}`}>
                Chronomètre libre
              </button>
            </div>
          </div>

          {timerMode === 'countdown' && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Durée par série</p>
              <div className="flex flex-wrap gap-2">
                {PLANK_GOAL_PRESETS_SECONDS.map(g => (
                  <button key={g} onClick={() => setTargetSeconds(g)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-bold border-2 ${targetSeconds === g ? 'border-teal-600 bg-teal-600 text-white' : 'border-gray-200 text-gray-700'}`}>
                    {formatPlankGoal(g)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="number" inputMode="numeric" placeholder="min" value={customMin} onChange={e => setCustomMin(e.target.value)}
                  className="w-16 h-10 rounded-lg border-2 border-gray-200 px-2 text-sm font-semibold text-center" />
                <input type="number" inputMode="numeric" placeholder="sec" value={customSec} onChange={e => setCustomSec(e.target.value)}
                  className="w-16 h-10 rounded-lg border-2 border-gray-200 px-2 text-sm font-semibold text-center" />
                <Button size="sm" variant="secondary" onClick={applyCustom}>Personnalisé</Button>
              </div>
            </div>
          )}

          {timerMode === 'countdown' && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nombre de séries</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setSetCount(c => Math.max(1, c - 1))} className="w-10 h-10 rounded-full bg-gray-100 font-bold text-gray-600">-</button>
                <span className="text-xl font-black w-8 text-center">{setCount}</span>
                <button onClick={() => setSetCount(c => Math.min(10, c + 1))} className="w-10 h-10 rounded-full bg-gray-100 font-bold text-gray-600">+</button>
              </div>
            </div>
          )}

          {timerMode === 'countdown' && setCount > 1 && (
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
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Type de gainage</p>
            <div className="flex flex-col gap-1.5">
              {(Object.keys(VARIANT_LABELS) as PlankVariant[]).map(v => (
                <button key={v} onClick={() => setVariant(v)}
                  className={`h-11 rounded-xl text-sm font-semibold border-2 px-4 text-left ${variant === v ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-gray-200 text-gray-600'}`}>
                  {VARIANT_LABELS[v]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Audio</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['voiceEnabled', 'Voix'], ['beepEnabled', 'Bips'], ['gongEnabled', 'Gong'], ['vibrationEnabled', 'Vibrations'],
              ] as const).map(([key, label]) => (
                <button key={key}
                  onClick={() => setLocalSettings(s => ({ ...s, [key]: !s[key] }))}
                  className={`flex items-center gap-2 h-11 rounded-xl text-sm font-semibold border-2 px-3 ${localSettings[key] ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-gray-200 text-gray-400'}`}>
                  {key === 'vibrationEnabled' ? <Vibrate size={16} /> : localSettings[key] ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Button size="xl" fullWidth onClick={start}>
            <Play size={20} /> Démarrer <ChevronRight size={18} />
          </Button>
        </motion.div>
      )}

      {(phase === 'prepare' || phase === 'active') && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-teal-700 flex flex-col"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex justify-between items-center px-5 pt-4 pb-2">
            <p className="text-xs text-white/60">Série {setIndex + 1}/{setCount}</p>
            <p className="text-xs text-white/60">{VARIANT_LABELS[variant]}</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            {phase === 'prepare' ? (
              <p className="text-[110px] font-black text-white leading-none tabular-nums">{Math.max(1, prep.remainingSeconds)}</p>
            ) : (
              <>
                <p className="text-[90px] font-black text-white leading-none tabular-nums">
                  {formatClock(timerMode === 'countdown' ? hold.remainingSeconds : hold.elapsedSeconds)}
                </p>
                {paused && <p className="text-white/80 font-semibold">En pause</p>}
              </>
            )}
          </div>
          {phase === 'active' && (
            <div className="flex gap-3 px-4 py-4">
              <button onClick={() => setPaused(p => !p)} className="flex-1 flex items-center justify-center gap-2 bg-white/20 text-white font-semibold text-sm rounded-2xl py-4">
                <Pause size={18} /> {paused ? 'Reprendre' : 'Pause'}
              </button>
              <button onClick={stopSetEarly} className="flex-1 flex items-center justify-center gap-2 bg-white text-teal-700 font-semibold text-sm rounded-2xl py-4">
                <Square size={18} /> Arrêter
              </button>
            </div>
          )}
        </motion.div>
      )}

      {phase === 'resting' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center gap-5">
          <p className="text-gray-500 text-sm font-medium">Repos</p>
          <div className="w-36 h-36 rounded-full bg-teal-50 border-4 border-teal-200 flex flex-col items-center justify-center">
            <p className="text-5xl font-black text-teal-700">{rest.remainingSeconds}</p>
          </div>
          <Button variant="secondary" size="md" onClick={goToNextSet}>Passer le repos <ChevronRight size={16} /></Button>
          <button onClick={abortSession} className="text-center text-xs text-gray-400 py-2">Abandonner la séance</button>
        </motion.div>
      )}

      {phase === 'confirm' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
          <p className="text-2xl font-bold text-gray-900">Séance terminée</p>
          <Card className="w-full max-w-xs bg-gray-50">
            <p className="text-sm text-gray-600">
              {formatPlankGoal(completedSets.filter(s => s.status === 'completed').reduce((s, x) => s + x.actualSeconds, 0))} de maintien enregistrés.
            </p>
          </Card>
          <Button size="xl" onClick={confirmAndSave}>Confirmer et enregistrer</Button>
        </motion.div>
      )}

      {phase === 'config' && (
        <button onClick={onCancel} className="mt-2 text-center text-xs text-gray-400 py-2">Annuler</button>
      )}
    </div>
  )
}
