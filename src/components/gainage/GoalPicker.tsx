'use client'
import { useState } from 'react'
import { Target } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PLANK_GOAL_PRESETS_SECONDS, CUSTOM_GOAL_MIN_SECONDS, CUSTOM_GOAL_MAX_SECONDS, recommendGoalSeconds } from '@/lib/plank/config'
import { formatPlankGoal, parseMinutesSecondsInput } from '@/lib/plank/format'

interface GoalPickerProps {
  /** Résultat de référence (test initial ou objectif courant) pour calculer la recommandation. Optionnel. */
  referenceSeconds?: number
  initialGoalSeconds?: number
  onConfirm: (goalSeconds: number) => void
  confirmLabel?: string
}

export function GoalPicker({ referenceSeconds, initialGoalSeconds, onConfirm, confirmLabel = 'Confirmer' }: GoalPickerProps) {
  const recommended = referenceSeconds != null ? recommendGoalSeconds(referenceSeconds) : null
  const [goal, setGoal] = useState<number>(initialGoalSeconds ?? recommended ?? PLANK_GOAL_PRESETS_SECONDS[0])
  const [showCustom, setShowCustom] = useState(false)
  const [customMin, setCustomMin] = useState('')
  const [customSec, setCustomSec] = useState('')
  const [customError, setCustomError] = useState<string | null>(null)

  const applyCustom = () => {
    const seconds = parseMinutesSecondsInput(customMin, customSec)
    if (seconds === null) { setCustomError('Durée invalide.'); return }
    if (seconds < CUSTOM_GOAL_MIN_SECONDS || seconds > CUSTOM_GOAL_MAX_SECONDS) {
      setCustomError(`Entre ${formatPlankGoal(CUSTOM_GOAL_MIN_SECONDS)} et ${formatPlankGoal(CUSTOM_GOAL_MAX_SECONDS)}.`)
      return
    }
    setCustomError(null)
    setGoal(seconds)
    setShowCustom(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {recommended != null && (
        <Card className="bg-teal-50 border-teal-200">
          <p className="text-sm font-semibold text-teal-900">
            Objectif recommandé : {formatPlankGoal(recommended)}
          </p>
          <p className="text-xs text-teal-700 mt-0.5">
            Tu peux le suivre ou choisir n&apos;importe quelle autre durée ci-dessous.
          </p>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {PLANK_GOAL_PRESETS_SECONDS.map(g => (
          <button
            key={g}
            onClick={() => { setGoal(g); setShowCustom(false) }}
            className={`px-4 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all
              ${goal === g && !showCustom
                ? 'border-teal-600 bg-teal-600 text-white shadow-md shadow-teal-200'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
          >
            {formatPlankGoal(g)}
            {g === recommended && <span className="ml-1 text-xs opacity-70">*</span>}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(s => !s)}
          className={`px-4 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all
            ${showCustom ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-gray-200 bg-white text-gray-500'}`}
        >
          Durée personnalisée
        </button>
      </div>

      {showCustom && (
        <Card className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="number" inputMode="numeric" min={0} placeholder="min"
              value={customMin} onChange={e => setCustomMin(e.target.value)}
              className="w-20 h-12 rounded-xl border-2 border-gray-200 px-3 text-base font-semibold text-center focus:outline-none focus:border-teal-500"
            />
            <span className="text-gray-400 font-semibold">min</span>
            <input
              type="number" inputMode="numeric" min={0} max={59} placeholder="sec"
              value={customSec} onChange={e => setCustomSec(e.target.value)}
              className="w-20 h-12 rounded-xl border-2 border-gray-200 px-3 text-base font-semibold text-center focus:outline-none focus:border-teal-500"
            />
            <span className="text-gray-400 font-semibold">s</span>
            <Button size="sm" onClick={applyCustom} className="ml-auto">OK</Button>
          </div>
          {customError && <p className="text-xs text-red-500">{customError}</p>}
          <p className="text-xs text-gray-400">
            Entre {formatPlankGoal(CUSTOM_GOAL_MIN_SECONDS)} et {formatPlankGoal(CUSTOM_GOAL_MAX_SECONDS)}.
          </p>
        </Card>
      )}

      <Card className="bg-gray-50 border-none flex items-center gap-3">
        <Target size={20} className="text-teal-600 shrink-0" />
        <p className="text-sm font-semibold text-gray-800">Objectif choisi : {formatPlankGoal(goal)}</p>
      </Card>

      <Button size="xl" fullWidth onClick={() => onConfirm(goal)}>{confirmLabel}</Button>
    </div>
  )
}
