'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, Minus, Zap, Trophy } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { TapZone } from './ui/TapZone'
import { usePushupCounter } from '@/hooks/usePushupCounter'
import { useVibration } from '@/hooks/useVibration'
import { SensorMode } from '@/types'
import { formatDuration } from '@/lib/utils'

type Phase = 'intro' | 'active' | 'done'

interface MaxPerformanceSessionProps {
  sensorMode: SensorMode
  personalBest: number
  onComplete: (reps: number, duration: number) => void
  onAbort: () => void
}

const MODE_LABELS: Record<SensorMode, string> = {
  tap:           'Tap manuel',
  accelerometer: 'Capteur de mouvement',
  camera:        'Caméra frontale',
  proximity:     'Capteur de proximité',
}

export function MaxPerformanceSession({
  sensorMode, personalBest, onComplete, onAbort,
}: MaxPerformanceSessionProps) {
  const [phase, setPhase]       = useState<Phase>('intro')
  const [elapsed, setElapsed]   = useState(0)
  const [pulseKey, setPulseKey] = useState(0)
  const [displayCount, setDisplayCount] = useState(0)
  const [isNewRecord, setIsNewRecord]   = useState(false)
  const startTime = useRef(0)
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const { vibrateRep, vibrateComplete } = useVibration()

  const handleRep = (c: number) => {
    setDisplayCount(c)
    setPulseKey(k => k + 1)
    vibrateRep()
  }

  const { addRep, reset, sensorReady } = usePushupCounter({
    mode:   sensorMode,
    active: phase === 'active',
    onRep:  handleRep,
  })

  useEffect(() => {
    if (phase !== 'active') { clearInterval(timerRef.current!); return }
    startTime.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000))
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase])

  const start = () => {
    reset()
    setDisplayCount(0)
    setElapsed(0)
    setPhase('active')
  }

  const stop = () => {
    clearInterval(timerRef.current!)
    const newRecord = displayCount > personalBest
    setIsNewRecord(newRecord)
    if (newRecord) vibrateComplete()
    setPhase('done')
  }

  const isTap = sensorMode === 'tap'
  const pctOfBest = personalBest > 0 ? Math.min(Math.round((displayCount / personalBest) * 100), 200) : null

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="wait">

        {/* ── INTRO ── */}
        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">
            <Card>
              <p className="font-bold text-gray-900 mb-2">Comment ça marche ?</p>
              <ul className="text-sm text-gray-600 flex flex-col gap-1.5">
                <li className="flex gap-2"><span className="text-brand-500 font-bold">1.</span> Mets-toi en position</li>
                <li className="flex gap-2"><span className="text-brand-500 font-bold">2.</span> Appuie sur Démarrer</li>
                <li className="flex gap-2">
                  <span className="text-brand-500 font-bold">3.</span>
                  {isTap
                    ? "Tape la zone orange à chaque pompe"
                    : "Fais tes pompes — le capteur compte automatiquement"}
                </li>
                <li className="flex gap-2"><span className="text-brand-500 font-bold">4.</span> Arrête quand tu ne peux plus</li>
              </ul>
            </Card>

            {personalBest > 0 && (
              <Card className="bg-amber-50 border-amber-200 flex items-center gap-3">
                <Trophy size={22} className="text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs text-amber-700 font-medium">Record à battre</p>
                  <p className="text-2xl font-black text-amber-900">{personalBest} <span className="text-sm font-normal">pompes</span></p>
                </div>
              </Card>
            )}

            <div className="flex items-center gap-2 bg-brand-50 rounded-full px-3 py-1.5 self-start">
              <Zap size={13} className="text-brand-500" />
              <span className="text-xs font-semibold text-brand-700">{MODE_LABELS[sensorMode]}</span>
            </div>

            <Button size="xl" fullWidth onClick={start}>
              <Play size={20} /> C'est parti !
            </Button>
            <button onClick={onAbort} className="text-center text-sm text-gray-400 py-1">Annuler</button>
          </motion.div>
        )}

        {/* ── ACTIVE ── */}
        {phase === 'active' && (
          <motion.div key="active" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5">

            {/* Timer */}
            <p className="text-gray-400 text-sm font-mono">{formatDuration(elapsed)}</p>

            {/* Counter */}
            {isTap ? (
              <TapZone onTap={addRep} pulseKey={pulseKey}>
                <div className="text-8xl font-black leading-none">{displayCount}</div>
                <div className="text-sm mt-1 font-semibold text-white/70">
                  pompe{displayCount !== 1 ? 's' : ''}
                </div>
                <div className="absolute bottom-6 text-white/50 text-xs">TAPE ICI</div>
              </TapZone>
            ) : (
              <motion.button
                key={pulseKey}
                animate={pulseKey > 0 ? { scale: [1, 1.07, 1] } : {}}
                transition={{ duration: 0.22 }}
                className="relative rounded-full shadow-2xl flex flex-col items-center justify-center select-none bg-brand-50 border-4 border-brand-200 cursor-default w-60 h-60"
              >
                <div className="text-8xl font-black leading-none text-brand-600">{displayCount}</div>
                <div className="text-sm mt-1 font-semibold text-brand-400">
                  pompe{displayCount !== 1 ? 's' : ''}
                </div>
              </motion.button>
            )}

            {/* Personal best progress */}
            {pctOfBest !== null && (
              <div className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors
                ${displayCount > personalBest
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-500'}`}>
                {displayCount > personalBest
                  ? `🏆 Nouveau record ! +${displayCount - personalBest}`
                  : `${pctOfBest}% du record (${personalBest})`}
              </div>
            )}

            {/* Sensor status */}
            {!isTap && (
              <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium
                ${sensorReady ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                <span className={`w-2 h-2 rounded-full ${sensorReady ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                {sensorReady ? 'Capteur actif' : 'Initialisation…'}
              </div>
            )}

            <div className="flex gap-3 w-full">
              <Button variant="secondary" size="md" className="flex-1"
                onClick={() => setDisplayCount(c => Math.max(0, c - 1))}
                disabled={displayCount === 0}>
                <Minus size={16} /> Corriger
              </Button>
              <Button variant="danger" size="md" className="flex-1" onClick={stop}>
                <Square size={16} /> Terminer
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── DONE ── */}
        {phase === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-5 text-center">

            {isNewRecord ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
                <div className="text-6xl mb-1">🏆</div>
                <p className="text-2xl font-black text-gray-900">Nouveau record !</p>
              </motion.div>
            ) : (
              <div>
                <div className="text-5xl mb-2">💪</div>
                <p className="text-xl font-bold text-gray-900">Belle performance !</p>
              </div>
            )}

            {/* Big result */}
            <Card elevated className="w-full py-6">
              <p className="text-gray-400 text-sm mb-1">Résultat</p>
              <div className="text-7xl font-black text-brand-500">{displayCount}</div>
              <p className="text-gray-500 mt-1">pompe{displayCount !== 1 ? 's' : ''} d'affilée</p>
              <p className="text-xs text-gray-400 mt-2">{formatDuration(elapsed)}</p>
            </Card>

            {personalBest > 0 && !isNewRecord && (
              <Card className="w-full bg-gray-50">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ton record</span>
                  <span className="font-bold text-gray-900">{personalBest} pompes</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Différence</span>
                  <span className={`font-bold ${displayCount >= personalBest ? 'text-emerald-600' : 'text-red-500'}`}>
                    {displayCount >= personalBest ? '+' : ''}{displayCount - personalBest}
                  </span>
                </div>
              </Card>
            )}

            <Button size="xl" fullWidth onClick={() => onComplete(displayCount, elapsed)}>
              Sauvegarder
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
