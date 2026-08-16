'use client'
import { useState } from 'react'
import { Target } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  JUMP_GOAL_PRESETS, DURATION_GOAL_PRESETS_SECONDS, CUSTOM_JUMPS_MIN, CUSTOM_JUMPS_MAX,
  CUSTOM_DURATION_MIN_SECONDS, CUSTOM_DURATION_MAX_SECONDS, INTERVAL_TEMPLATES, buildIntervalBlocks,
} from '@/lib/rope/config'
import { formatClock, formatJumps } from '@/lib/rope/format'
import { SessionBlock } from './JumpRopeSessionRunner'

interface JumpConfigStepProps {
  mode: 'goal_jumps' | 'goal_duration' | 'intervals'
  onConfirm: (blocks: SessionBlock[]) => void
}

export function JumpConfigStep({ mode, onConfirm }: JumpConfigStepProps) {
  const [goalJumps, setGoalJumps] = useState<number>(JUMP_GOAL_PRESETS[1])
  const [goalDuration, setGoalDuration] = useState<number>(DURATION_GOAL_PRESETS_SECONDS[1])
  const [customValue, setCustomValue] = useState('')
  const [customError, setCustomError] = useState<string | null>(null)
  const [templateId, setTemplateId] = useState(INTERVAL_TEMPLATES[0].id)

  if (mode === 'goal_jumps') {
    const applyCustom = () => {
      const n = Number(customValue)
      if (!Number.isFinite(n) || n < CUSTOM_JUMPS_MIN || n > CUSTOM_JUMPS_MAX) {
        setCustomError(`Entre ${CUSTOM_JUMPS_MIN} et ${formatJumps(CUSTOM_JUMPS_MAX)} sauts.`)
        return
      }
      setCustomError(null)
      setGoalJumps(Math.round(n))
    }
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-black text-gray-900">Combien de sauts ?</h1>
        <div className="flex flex-wrap gap-2">
          {JUMP_GOAL_PRESETS.map(g => (
            <button key={g} onClick={() => setGoalJumps(g)}
              className={`px-4 py-2.5 rounded-2xl text-sm font-bold border-2 ${goalJumps === g ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-200 bg-white text-gray-700'}`}>
              {formatJumps(g)}
            </button>
          ))}
        </div>
        <Card className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input type="number" inputMode="numeric" placeholder="Personnalisé" value={customValue} onChange={e => setCustomValue(e.target.value)}
              className="flex-1 h-12 rounded-xl border-2 border-gray-200 px-3 text-base font-semibold text-center" />
            <Button size="sm" onClick={applyCustom}>OK</Button>
          </div>
          {customError && <p className="text-xs text-red-500">{customError}</p>}
        </Card>
        <Card className="bg-gray-50 flex items-center gap-3">
          <Target size={20} className="text-violet-600 shrink-0" />
          <p className="text-sm font-semibold text-gray-800">Objectif choisi : {formatJumps(goalJumps)} sauts</p>
        </Card>
        <Button size="xl" fullWidth onClick={() => onConfirm([{ type: 'work', durationSeconds: null, targetJumps: goalJumps, label: 'Objectif' }])}>
          Continuer
        </Button>
      </div>
    )
  }

  if (mode === 'goal_duration') {
    const applyCustom = () => {
      const n = Number(customValue)
      if (!Number.isFinite(n) || n < CUSTOM_DURATION_MIN_SECONDS || n > CUSTOM_DURATION_MAX_SECONDS) {
        setCustomError(`Entre ${formatClock(CUSTOM_DURATION_MIN_SECONDS)} et ${formatClock(CUSTOM_DURATION_MAX_SECONDS)}.`)
        return
      }
      setCustomError(null)
      setGoalDuration(Math.round(n))
    }
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-black text-gray-900">Combien de temps ?</h1>
        <div className="flex flex-wrap gap-2">
          {DURATION_GOAL_PRESETS_SECONDS.map(s => (
            <button key={s} onClick={() => setGoalDuration(s)}
              className={`px-4 py-2.5 rounded-2xl text-sm font-bold border-2 ${goalDuration === s ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-200 bg-white text-gray-700'}`}>
              {formatClock(s)}
            </button>
          ))}
        </div>
        <Card className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input type="number" inputMode="numeric" placeholder="Secondes personnalisées" value={customValue} onChange={e => setCustomValue(e.target.value)}
              className="flex-1 h-12 rounded-xl border-2 border-gray-200 px-3 text-base font-semibold text-center" />
            <Button size="sm" onClick={applyCustom}>OK</Button>
          </div>
          {customError && <p className="text-xs text-red-500">{customError}</p>}
        </Card>
        <Card className="bg-gray-50 flex items-center gap-3">
          <Target size={20} className="text-violet-600 shrink-0" />
          <p className="text-sm font-semibold text-gray-800">Objectif choisi : {formatClock(goalDuration)}</p>
        </Card>
        <Button size="xl" fullWidth onClick={() => onConfirm([{ type: 'work', durationSeconds: goalDuration, targetJumps: null, label: 'Objectif' }])}>
          Continuer
        </Button>
      </div>
    )
  }

  const template = INTERVAL_TEMPLATES.find(t => t.id === templateId)!
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-black text-gray-900">Choisis un modèle d&apos;intervalles</h1>
      <div className="flex flex-col gap-2.5">
        {INTERVAL_TEMPLATES.map(t => (
          <button key={t.id} onClick={() => setTemplateId(t.id)}
            className={`flex items-center justify-between p-3.5 rounded-2xl border-2 text-left ${templateId === t.id ? 'border-violet-600 bg-violet-50' : 'border-gray-100 bg-white'}`}>
            <span className="font-bold text-gray-900 text-sm">{t.name}</span>
            <span className="text-xs text-gray-500">{t.rounds} × {t.workSeconds}s</span>
          </button>
        ))}
      </div>
      <Button size="xl" fullWidth onClick={() => onConfirm(buildIntervalBlocks(template))}>Continuer</Button>
    </div>
  )
}
