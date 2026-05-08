'use client'
import { motion } from 'framer-motion'
import { CheckCircle, TrendingUp, Clock, Target } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { CompletedSet } from '@/types'
import { formatDuration } from '@/lib/utils'
import { getCompletionMessage } from '@/lib/motivation'
import { ALL_BADGES } from '@/lib/programGenerator'
import { Level } from '@/types'

interface WorkoutSummaryProps {
  sets: CompletedSet[]
  targetReps: number
  duration: number
  newBadges?: string[]
  level: Level
  onContinue: () => void
}

export function WorkoutSummary({
  sets, targetReps, duration, newBadges = [], level, onContinue
}: WorkoutSummaryProps) {
  const totalReps     = sets.reduce((s, r) => s + r.completedReps, 0)
  const completion    = Math.min(Math.round((totalReps / targetReps) * 100), 100)
  const bestSet       = Math.max(...sets.map(s => s.completedReps))
  const message       = getCompletionMessage(level)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5"
    >
      {/* Hero */}
      <div className="text-center py-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="inline-block mb-3"
        >
          <CheckCircle size={56} className="text-emerald-500 mx-auto" />
        </motion.div>
        <h2 className="text-2xl font-black text-gray-900">Séance terminée !</h2>
        <p className="text-gray-500 text-sm mt-1">{message}</p>
      </div>

      {/* Big stats */}
      <Card elevated className="text-center py-6">
        <div className="text-6xl font-black text-brand-500">{totalReps}</div>
        <div className="text-gray-500 text-sm mt-1">pompes réalisées</div>
        <div className="mt-2 text-xs text-gray-400">{completion}% de l'objectif</div>
      </Card>

      {/* Detail stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <Target size={18} className="text-brand-400 mx-auto mb-1" />
          <div className="font-bold text-gray-900">{targetReps}</div>
          <div className="text-xs text-gray-500">Objectif</div>
        </Card>
        <Card className="text-center">
          <TrendingUp size={18} className="text-emerald-500 mx-auto mb-1" />
          <div className="font-bold text-gray-900">{bestSet}</div>
          <div className="text-xs text-gray-500">Meilleure</div>
        </Card>
        <Card className="text-center">
          <Clock size={18} className="text-blue-400 mx-auto mb-1" />
          <div className="font-bold text-gray-900">{formatDuration(duration)}</div>
          <div className="text-xs text-gray-500">Durée</div>
        </Card>
      </div>

      {/* Sets detail */}
      <Card>
        <p className="text-sm font-semibold text-gray-700 mb-3">Détail des séries</p>
        <div className="flex flex-col gap-2">
          {sets.map((s, i) => {
            const pct = Math.min((s.completedReps / s.targetReps) * 100, 100)
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-12">Série {i + 1}</span>
                <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.1 }}
                    className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-brand-500' : 'bg-orange-300'}`}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                  {s.completedReps}/{s.targetReps}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* New badges */}
      {newBadges.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <p className="text-sm font-semibold text-amber-800 mb-2">🏆 Nouveau badge !</p>
          <div className="flex flex-col gap-2">
            {newBadges.map(id => {
              const badge = ALL_BADGES.find(b => b.id === id)
              if (!badge) return null
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <p className="font-semibold text-amber-900 text-sm">{badge.name}</p>
                    <p className="text-xs text-amber-700">{badge.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </Card>
      )}

      <Button size="xl" fullWidth onClick={onContinue}>
        Retour au tableau de bord
      </Button>
    </motion.div>
  )
}
