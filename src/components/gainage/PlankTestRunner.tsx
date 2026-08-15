'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PlankGuideCard } from './PlankGuideCard'
import { GoalPicker } from './GoalPicker'
import { usePlankTimer } from '@/hooks/plank/usePlankTimer'
import { usePlankAudio } from '@/hooks/plank/usePlankAudio'
import { useWakeLock } from '@/hooks/useWakeLock'
import { formatClock } from '@/lib/plank/format'
import { PlankSettings } from '@/types/plank'

type Phase = 'intro' | 'prepare' | 'active' | 'confirm' | 'goal'

interface PlankTestRunnerProps {
  settings: PlankSettings
  onComplete: (durationSeconds: number, goalSeconds: number) => void
}

export function PlankTestRunner({ settings, onComplete }: PlankTestRunnerProps) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [finalSeconds, setFinalSeconds] = useState(0)
  const engine = usePlankAudio(settings)
  useWakeLock(phase === 'prepare' || phase === 'active')

  const prep = usePlankTimer({
    mode: 'countdown',
    targetSeconds: 3,
    running: phase === 'prepare',
    onTick: (_e, remaining) => { if (remaining >= 1 && remaining <= 3) engine.announceCountIn(remaining as 1 | 2 | 3) },
    onComplete: () => { engine.announceGainage(); setPhase('active') },
  })

  const active = usePlankTimer({
    mode: 'stopwatch',
    running: phase === 'active',
    onTick: (elapsed) => { if (elapsed > 0 && elapsed % 10 === 0) engine.beep() },
  })

  useEffect(() => {
    if (phase === 'prepare') { engine.resetTickGuard(); prep.reset() }
    if (phase === 'active') { engine.resetTickGuard(); active.reset() }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const stop = () => {
    setFinalSeconds(active.elapsedSeconds)
    setPhase('confirm')
  }

  return (
    <div className="flex flex-col gap-5">
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
            <PlankGuideCard />
            <Button size="xl" fullWidth onClick={() => { engine.resume(); setPhase('prepare') }}>
              <Play size={20} /> Démarrer le test
            </Button>
          </motion.div>
        )}

        {(phase === 'prepare' || phase === 'active') && (
          <motion.div key="run" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-teal-700 flex flex-col items-center justify-center gap-8"
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {phase === 'prepare' ? (
              <div className="text-center">
                <p className="text-white/70 text-sm uppercase tracking-widest mb-3">Préparation</p>
                <p className="text-[120px] font-black text-white leading-none tabular-nums">{Math.max(1, prep.remainingSeconds)}</p>
              </div>
            ) : (
              <>
                <p className="text-white/70 text-sm uppercase tracking-widest">Gainage</p>
                <p className="text-[90px] font-black text-white leading-none tabular-nums">{formatClock(active.elapsedSeconds)}</p>
                <button
                  onClick={stop}
                  className="flex items-center gap-2 bg-white text-teal-700 font-bold text-base rounded-2xl px-8 py-4 shadow-xl"
                >
                  <Square size={20} /> Arrêter
                </button>
              </>
            )}
          </motion.div>
        )}

        {phase === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-5 text-center">
            <CheckCircle size={48} className="text-emerald-500" />
            <div>
              <p className="text-gray-500 text-sm mb-1">Ton temps de maintien</p>
              <p className="text-6xl font-black text-gray-900">{formatClock(finalSeconds)}</p>
            </div>
            <Card className="w-full text-left bg-gray-50">
              <p className="text-sm text-gray-600">Confirme ce résultat pour l&apos;enregistrer, ou annule pour recommencer sans rien sauvegarder.</p>
            </Card>
            <div className="flex gap-3 w-full">
              <Button variant="secondary" className="flex-1" onClick={() => setPhase('intro')}>
                <XCircle size={16} /> Annuler le test
              </Button>
              <Button className="flex-1" onClick={() => setPhase('goal')}>
                Confirmer
              </Button>
            </div>
          </motion.div>
        )}

        {phase === 'goal' && (
          <motion.div key="goal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-1">Quel est ton objectif ?</h2>
              <p className="text-sm text-gray-500">Ton résultat : {formatClock(finalSeconds)}</p>
            </div>
            <GoalPicker
              referenceSeconds={finalSeconds}
              onConfirm={(goal) => onComplete(finalSeconds, goal)}
              confirmLabel="Créer mon programme"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
