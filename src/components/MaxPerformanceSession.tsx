'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, Minus, Trophy, ChevronRight } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { usePushupCounter } from '@/hooks/usePushupCounter'
import { useVibration } from '@/hooks/useVibration'
import { formatDuration } from '@/lib/utils'

type Phase = 'intro' | 'active' | 'done'

interface MaxPerformanceSessionProps {
  personalBest: number
  onComplete: (reps: number, duration: number) => void
  onAbort: () => void
}

export function MaxPerformanceSession({ personalBest, onComplete, onAbort }: MaxPerformanceSessionProps) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [elapsed, setElapsed] = useState(0)
  const [pulseKey, setPulseKey] = useState(0)
  const [displayCount, setDisplayCount] = useState(0)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const startTime = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { vibrateRep, vibrateComplete } = useVibration()

  const handleRep = (c: number) => {
    setDisplayCount(c)
    setPulseKey(k => k + 1)
    vibrateRep()
  }

  const { addRep, decrement, reset } = usePushupCounter({
    active: phase === 'active',
    onRep: handleRep,
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

  const pctOfBest = personalBest > 0 ? Math.min(Math.round((displayCount / personalBest) * 100), 200) : null

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">
            <Card>
              <p className="font-bold text-gray-900 mb-2">Comment ca marche ?</p>
              <ul className="text-sm text-gray-600 flex flex-col gap-1.5">
                <li className="flex gap-2"><span className="text-brand-500 font-bold">1.</span> Mets-toi en position</li>
                <li className="flex gap-2"><span className="text-brand-500 font-bold">2.</span> Appuie sur Démarrer</li>
                <li className="flex gap-2"><span className="text-brand-500 font-bold">3.</span> Tape l'écran à chaque pompe — ou touche avec le bout du nez</li>
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

            <Button size="xl" fullWidth onClick={start}>
              <Play size={20} /> C'est parti !
            </Button>
            <button onClick={onAbort} className="text-center text-sm text-gray-400 py-1">Annuler</button>
          </motion.div>
        )}

        {/* ─── FULLSCREEN ACTIVE PHASE ───────────────────────────── */}
        {phase === 'active' && (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brand-500 flex flex-col"
            style={{
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Info bar */}
            <div className="flex justify-between items-center px-5 pt-3 pb-2">
              <p className="text-white/60 text-sm font-mono">{formatDuration(elapsed)}</p>
              {pctOfBest !== null && (
                <div className={`text-xs font-semibold px-3 py-1 rounded-full
                  ${displayCount > personalBest ? 'bg-white/30 text-white' : 'bg-white/15 text-white/70'}`}>
                  {displayCount > personalBest
                    ? `+${displayCount - personalBest} record !`
                    : `${pctOfBest}% du record`}
                </div>
              )}
              <div className="w-20" />
            </div>

            {/* Tap zone */}
            <motion.button
              key={pulseKey}
              animate={pulseKey > 0 ? { scale: [1, 1.015, 1] } : {}}
              transition={{ duration: 0.15 }}
              onTouchStart={(e) => { e.preventDefault(); addRep() }}
              onClick={addRep}
              className="flex-1 mx-3 rounded-3xl bg-white/10 flex flex-col items-center justify-center select-none relative"
              style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
            >
              <div className="text-[100px] font-black leading-none text-white tabular-nums">{displayCount}</div>
              <div className="text-white/50 text-base font-semibold mt-2">pompe{displayCount !== 1 ? 's' : ''}</div>
              <div className="absolute bottom-6 text-white/30 text-xs tracking-[0.3em] uppercase">Tape ici</div>
            </motion.button>

            {/* Bottom controls */}
            <div className="flex gap-3 px-4 py-3">
              <button
                onClick={() => decrement()}
                disabled={displayCount === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-white/20 text-white font-semibold text-sm rounded-2xl py-4 disabled:opacity-40"
              >
                <Minus size={18} /> Corriger
              </button>
              <button
                onClick={stop}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-brand-600 font-semibold text-sm rounded-2xl py-4"
              >
                <Square size={18} /> Terminer
              </button>
            </div>
          </motion.div>
        )}

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
              Sauvegarder <ChevronRight size={20} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
