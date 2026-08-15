'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { PlankSessionRunner } from '@/components/gainage/PlankSessionRunner'
import { usePlankData } from '@/hooks/plank/usePlankData'
import { getNextPlankProgramSession } from '@/lib/plank/programGenerator'
import { ALL_PLANK_BADGES } from '@/lib/plank/badges'
import { formatPlankGoal } from '@/lib/plank/format'
import { PlankSet, PlankDifficultyFeedback } from '@/types/plank'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function GainageSessionPage() {
  const router = useRouter()
  const { hydrated, gainage, recordSession, recordProgramSessionFeedback, saveDraftSession } = usePlankData()
  const [result, setResult] = useState<{ totalHold: number; newBadges: string[] } | null>(null)
  const prevBadgeCountRef = useRef(gainage.earnedBadges.length)

  const activeProgram = useMemo(
    () => gainage.programs.find(p => p.id === gainage.activeProgramId && p.status === 'active') ?? null,
    [gainage.programs, gainage.activeProgramId]
  )
  const nextSession = activeProgram ? getNextPlankProgramSession(activeProgram) : null

  useEffect(() => {
    if (hydrated && !nextSession) router.replace('/gainage')
  }, [hydrated, nextSession, router])

  useEffect(() => {
    if (!result) return
    const newlyEarned = gainage.earnedBadges.slice(prevBadgeCountRef.current)
    if (newlyEarned.length > 0 && result.newBadges.length === 0) {
      setResult(r => (r ? { ...r, newBadges: newlyEarned } : r))
    }
  }, [gainage.earnedBadges, result])

  if (!hydrated || !activeProgram || !nextSession) return (
    <div className="app-content-page flex items-center justify-center" style={{ minHeight: '75dvh' }}>
      <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
    </div>
  )

  const handleStarted = () => {
    saveDraftSession({
      id: `draft_${Date.now()}`,
      mode: 'program',
      startedAt: new Date().toISOString(),
      plannedDurationSeconds: nextSession.sets.reduce((s, x) => s + x.targetSeconds, 0),
      plannedSetCount: nextSession.sets.length,
      restSeconds: gainage.settings.restSeconds,
      programId: activeProgram.id,
      programSessionIndex: nextSession.index,
      variant: 'forearm',
    })
  }

  const handleComplete = (
    sets: PlankSet[],
    durationSeconds: number,
    status: 'completed' | 'interrupted',
    feedback: PlankDifficultyFeedback | null
  ) => {
    recordSession({
      mode: 'program',
      plannedDurationSeconds: nextSession.sets.reduce((s, x) => s + x.targetSeconds, 0),
      actualDurationSeconds: durationSeconds,
      plannedSetCount: nextSession.sets.length,
      sets,
      restSeconds: gainage.settings.restSeconds,
      status,
      difficultyFeedback: feedback,
      programSessionIndex: nextSession.index,
    })
    if (feedback) recordProgramSessionFeedback(nextSession.index, feedback)

    const totalHold = sets.filter(s => s.status === 'completed').reduce((s, x) => s + x.actualSeconds, 0)
    setResult({ totalHold, newBadges: [] })
  }

  if (result) {
    const badgeDetails = ALL_PLANK_BADGES.filter(b => result.newBadges.includes(b.id))
    return (
      <div className="app-content-page bg-white flex flex-col items-center justify-center gap-5 text-center px-6">
        <p className="text-2xl font-bold text-gray-900">Séance enregistrée</p>
        <p className="text-gray-500">{formatPlankGoal(result.totalHold)} de maintien au total</p>
        {badgeDetails.length > 0 && (
          <Card className="bg-amber-50 border-amber-200 w-full max-w-xs">
            <p className="text-sm font-semibold text-amber-800 mb-2">Nouveau{badgeDetails.length > 1 ? 'x' : ''} badge{badgeDetails.length > 1 ? 's' : ''} !</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {badgeDetails.map(b => (
                <span key={b.id} className="flex items-center gap-1 bg-white rounded-full px-2.5 py-1 text-xs font-medium text-amber-800">
                  {b.icon} {b.name}
                </span>
              ))}
            </div>
          </Card>
        )}
        <Button size="xl" onClick={() => router.push('/gainage')}>Retour à l&apos;accueil</Button>
      </div>
    )
  }

  return (
    <div className="app-content-page bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <div>
          <h1 className="font-black text-xl text-gray-900">Séance guidée</h1>
          <p className="text-xs text-gray-500">Semaine {nextSession.week} · Jour {nextSession.day}</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col pt-2 px-4 page-scroll-gutter">
        <PlankSessionRunner
          session={nextSession}
          settings={gainage.settings}
          title={`Semaine ${nextSession.week} · Jour ${nextSession.day}`}
          onStarted={handleStarted}
          onComplete={handleComplete}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  )
}
