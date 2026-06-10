'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Hand, CheckCircle } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { SensorMode } from '@/types'

interface SensorCalibrationProps {
  initialMode?: SensorMode
  onComplete: (mode: SensorMode) => void
}

export function SensorCalibration({ onComplete }: SensorCalibrationProps) {
  const [testCount, setTestCount] = useState(0)
  const [confirmed, setConfirmed] = useState(false)

  const handleTap = () => setTestCount(c => Math.min(c + 1, 3))

  const confirm = () => {
    setConfirmed(true)
    setTimeout(() => onComplete('tap'), 700)
  }

  if (confirmed) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-12">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
          <CheckCircle size={64} className="text-emerald-500" />
        </motion.div>
        <p className="font-bold text-xl text-gray-900">Tap configuré !</p>
        <p className="text-sm text-gray-500">Prêt pour le test</p>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="bg-brand-50 border-brand-200">
        <div className="flex gap-3 items-center">
          <Hand size={24} className="text-brand-500 shrink-0" />
          <div>
            <p className="font-semibold text-brand-900 text-sm">Tap manuel</p>
            <p className="text-xs text-brand-700 mt-0.5">
              Touchez l'écran à chaque pompe complète — avec le doigt ou le bout du nez.
            </p>
          </div>
        </div>
      </Card>

      <p className="text-gray-500 text-sm text-center">Faites 3 taps test pour valider :</p>

      <div className="flex justify-center gap-3">
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            animate={{
              scale: testCount > i ? 1 : 0.85,
              backgroundColor: testCount > i ? '#f97316' : '#e5e7eb',
            }}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl"
          >
            {testCount > i ? '✓' : i + 1}
          </motion.div>
        ))}
      </div>

      <motion.button
        animate={testCount > 0 ? { scale: [1, 1.03, 1] } : {}}
        key={testCount}
        onTouchStart={(e) => { e.preventDefault(); handleTap() }}
        onClick={handleTap}
        className="w-full rounded-3xl bg-brand-500 text-white font-bold text-2xl shadow-xl shadow-brand-200 select-none flex items-center justify-center active:scale-95 transition-transform"
        style={{ height: 200, touchAction: 'none', userSelect: 'none' }}
      >
        TAP
      </motion.button>

      <Button
        size="lg"
        fullWidth
        disabled={testCount < 1}
        onClick={confirm}
      >
        {testCount >= 3 ? 'Confirmer ✓' : `Encore ${3 - testCount} tap${3 - testCount > 1 ? 's' : ''}…`}
      </Button>
    </div>
  )
}
