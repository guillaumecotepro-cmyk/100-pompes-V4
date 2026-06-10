'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, Minus, CheckCircle, Target, ChevronRight } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { getLevelFromScore, getLevelLabel, getLevelBadgeClass } from '@/lib/utils'
import { usePushupCounter } from '@/hooks/usePushupCounter'
import { estimateProgramDuration } from '@/lib/programGenerator'

type Phase = 'intro' | 'active' | 'done' | 'goal'

const GOAL_PRESETS = [50, 75, 100, 150, 200, 300, 500]

interface InitialTestProps {
  onComplete: (score: number, goal: number) => void
}

export function InitialTest({ onComplete }: InitialTestProps) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [elapsed, setElapsed] = useState(0)
  const [pulseKey, setPulseKey] = useState(0)
  const [displayCount, setDisplayCount] = useState(0)
  const [goal, setGoal] = useState(100)
  const [customGoal, setCustomGoal] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTime = useRef(0)

  const handleRep = (c: number) => {
    setDisplayCount(c)
    setPulseKey(k => k + 1)
    if (navigator.vibrate) navigator.vibrate(25)
  }

  const { addRep, decrement, reset } = usePushupCounter({
    active: phase === 'active',
    onRep: handleRep,
  })

  useEffect(() => {
    if (phase !== 'active') { clearInterval(timerRef.current!); return }
    startTime.current = Date.now()
    setDisplayCount(0)
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000))
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase])

  useEffect(() => {
    if (phase === 'goal' && goal <= displayCount) {
      const next = GOAL_PRESETS.find(g => g > displayCount) ?? displayCount + 50
      setGoal(next)
    }
  }, [phase, displayCount, goal])

  const start = () => { reset(); setElapsed(0); setPhase('active') }
  const stop = () => { setPhase('done') }

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const level = getLevelFromScore(displayCount)

  const validPresets = GOAL_PRESETS.filter(g => g > displayCount)
  const { weeks, sessions: sessionCount } = estimateProgramDuration(displayCount, goal)

  const handleCustomGoalSubmit = () => {
    const val = parseInt(customGoal, 10)
    if (!isNaN(val) && val > displayCount && val <= 10000) {
      setGoal(val)
      setShowCustom(false)
      setCustomGoal('')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">
            <Card>
              <h2 className="font-bold text-lg text-gray-900 mb-3">Comment ca marche ?</h2>
              <ol className="flex flex-col gap-2 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-brand-500 font-bold shrink-0">1.</span> Mets-toi en position de pompe</li>
                <li className="flex gap-2"><span className="text-brand-500 font-bold shrink-0">2.</span> Appuie sur Démarrer</li>
                <li className="flex gap-2"><span className="text-brand-500 font-bold shrink-0">3.</span> Tape la grande zone orange à chaque pompe — ou touche avec le bout du nez</li>
                <li className="flex gap-2"><span className="text-brand-500 font-bold shrink-0">4.</span> Arrête quand tu ne peux plus</li>
              </ol>
            </Card>
            <Card className="bg-amber-50 border-amber-200">
              <p className="text-sm text-amber-800 font-medium">Donne tout : ce score calibre ton programme.</p>
            </Card>
            <Button size="xl" fullWidth onClick={start}>
              <Play size={20} /> Démarrer le test
            </Button>
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
            {/* Timer */}
            <div className="flex justify-center py-4">
              <p className="text-white/60 text-sm font-mono">{formatTime(elapsed)}</p>
            </div>

            {/* Tap zone */}
            <motion.button
              key={pulseKey}
              animate={pulseKey > 0 ? { scale: [1, 1.015, 1] } : {}}
              transition={{ duration: 0.15 }}
              onTouchStart={(e) => { e.preventDefault(); addRep() }}
              onClick={addRep}
              className="flex-1 w-full bg-white/15 flex flex-col items-center justify-center select-none relative"
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
          <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-5 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
              <CheckCircle size={56} className="text-emerald-500 mx-auto" />
            </motion.div>
            <div>
              <p className="text-gray-500 mb-1 text-sm">Ton score</p>
              <div className="text-7xl font-black text-gray-900">{displayCount}</div>
              <p className="text-gray-500 mt-1">pompe{displayCount !== 1 ? 's' : ''} d'affilée</p>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getLevelBadgeClass(level)}`}>
              {getLevelLabel(level)}
            </div>
            <Card className="w-full text-left bg-gray-50">
              <p className="text-sm text-gray-600">
                {displayCount === 0 && 'Pas de souci ! Ton programme débutera tout doucement.'}
                {displayCount > 0 && displayCount < 10 && 'Parfait pour débuter ! On va construire une base solide.'}
                {displayCount >= 10 && displayCount < 26 && 'Bonne base ! Tu vas progresser vite.'}
                {displayCount >= 26 && displayCount < 51 && 'Impressionnant ! Les grandes performances se profilent.'}
                {displayCount >= 51 && 'Niveau élite. Le programme sera à la hauteur.'}
              </p>
            </Card>
            <Button size="xl" fullWidth onClick={() => setPhase('goal')}>
              Choisir mon objectif <ChevronRight size={20} />
            </Button>
          </motion.div>
        )}

        {phase === 'goal' && (
          <motion.div key="goal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-5">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span className="font-semibold text-gray-900">{displayCount} pompes</span> au test initial
            </div>

            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-1">Quel est ton objectif ?</h2>
              <p className="text-sm text-gray-500">Combien de pompes d'affilée veux-tu réussir ?</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {validPresets.map(g => (
                <button key={g}
                  onClick={() => { setGoal(g); setShowCustom(false) }}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all
                    ${goal === g
                      ? 'border-brand-500 bg-brand-500 text-white shadow-md shadow-brand-200'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
                >
                  {g}
                  {g === 100 && <span className="ml-1 text-xs opacity-70">*</span>}
                </button>
              ))}
              <button
                onClick={() => setShowCustom(s => !s)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all
                  ${showCustom ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-500'}`}
              >
                Autre...
              </button>
            </div>

            <AnimatePresence>
              {showCustom && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex gap-2">
                  <input
                    type="number"
                    value={customGoal}
                    onChange={e => setCustomGoal(e.target.value)}
                    placeholder={`> ${displayCount}`}
                    min={displayCount + 1}
                    max={10000}
                    className="flex-1 h-12 rounded-2xl border-2 border-gray-200 px-4 text-base font-semibold focus:outline-none focus:border-brand-400"
                  />
                  <Button size="md" onClick={handleCustomGoalSubmit} disabled={!customGoal}>OK</Button>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div key={`${goal}-est`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-gradient-to-r from-brand-50 to-orange-50 border-brand-200">
                <div className="flex items-start gap-3">
                  <Target size={22} className="text-brand-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-brand-900 text-base">
                      Objectif : {goal} pompes d'affilée
                    </p>
                    <div className="flex gap-4 mt-1.5">
                      <div>
                        <p className="text-2xl font-black text-brand-700">{weeks}</p>
                        <p className="text-xs text-brand-600">semaine{weeks > 1 ? 's' : ''}</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-brand-700">{sessionCount}</p>
                        <p className="text-xs text-brand-600">séances</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-brand-700">3x</p>
                        <p className="text-xs text-brand-600">par semaine</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <Button size="xl" fullWidth onClick={() => onComplete(displayCount, goal)}>
              Créer mon programme <ChevronRight size={20} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
