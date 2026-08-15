'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Sparkles, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { GoalPicker } from '@/components/gainage/GoalPicker'
import { usePlankData } from '@/hooks/plank/usePlankData'
import { formatPlankGoal } from '@/lib/plank/format'

type Phase = 'choice' | 'goal'

export default function GainageProgramPage() {
  const router = useRouter()
  const { hydrated, gainage, startProgram, adaptActiveProgramGoal } = usePlankData()

  const activeProgram = gainage.programs.find(p => p.id === gainage.activeProgramId && p.status === 'active') ?? null
  const hasPendingSessions = activeProgram ? activeProgram.sessions.some(s => s.status === 'pending') : false
  const lastTest = gainage.tests[0] ?? null
  const referenceSeconds = lastTest?.durationSeconds ?? activeProgram?.initialSeconds

  const [phase, setPhase] = useState<Phase>(hasPendingSessions ? 'choice' : 'goal')
  const [mode, setMode] = useState<'new' | 'adapt'>('new')

  if (!hydrated) return null

  const handleGoalConfirm = (goal: number) => {
    if (mode === 'adapt' && activeProgram) {
      adaptActiveProgramGoal(goal)
    } else {
      startProgram(goal, referenceSeconds ?? 0)
    }
    router.push('/gainage')
  }

  return (
    <div className="app-content-page bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <h1 className="font-black text-xl text-gray-900">Objectif de gainage</h1>
      </div>

      <div className="flex-1 px-4 pb-8 page-scroll-gutter flex flex-col gap-4">
        {phase === 'choice' && activeProgram ? (
          <>
            <Card className="bg-gray-50 border-none">
              <p className="text-sm text-gray-600">
                Un programme est en cours (objectif {formatPlankGoal(activeProgram.goalSeconds)}). Veux-tu adapter ce
                programme à un nouvel objectif, ou repartir sur un programme neuf ? L&apos;ancien programme reste
                consultable dans ton historique.
              </p>
            </Card>
            <button
              onClick={() => { setMode('adapt'); setPhase('goal') }}
              className="flex items-center gap-3 p-4 rounded-2xl border-2 border-teal-200 bg-teal-50 text-left"
            >
              <RefreshCw size={20} className="text-teal-700 shrink-0" />
              <div>
                <p className="font-bold text-teal-900 text-sm">Adapter le programme actuel</p>
                <p className="text-xs text-teal-700 mt-0.5">Garde les séances déjà faites, ajuste les suivantes</p>
              </div>
            </button>
            <button
              onClick={() => { setMode('new'); setPhase('goal') }}
              className="flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 text-left"
            >
              <Sparkles size={20} className="text-gray-500 shrink-0" />
              <div>
                <p className="font-bold text-gray-900 text-sm">Démarrer un nouveau programme</p>
                <p className="text-xs text-gray-500 mt-0.5">L&apos;ancien reste dans ton historique</p>
              </div>
            </button>
          </>
        ) : (
          <GoalPicker
            referenceSeconds={referenceSeconds}
            initialGoalSeconds={mode === 'adapt' ? activeProgram?.goalSeconds : undefined}
            onConfirm={handleGoalConfirm}
            confirmLabel={mode === 'adapt' ? 'Adapter le programme' : 'Créer mon programme'}
          />
        )}
      </div>
    </div>
  )
}
