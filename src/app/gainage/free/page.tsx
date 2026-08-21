'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { FreeSessionRunner, PlankFreeConfig } from '@/components/gainage/FreeSessionRunner'
import { usePlankData } from '@/hooks/plank/usePlankData'
import { ALL_PLANK_BADGES } from '@/lib/plank/badges'
import { formatPlankGoal } from '@/lib/plank/format'
import { PlankSet } from '@/types/plank'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function GainageFreePage() {
  const router = useRouter()
  const { hydrated, gainage, recordSession, saveDraftSession } = usePlankData()
  const [result, setResult] = useState<{ totalHold: number; newBadges: string[] } | null>(null)
  const [lastConfig, setLastConfig] = useState<PlankFreeConfig | null>(null)
  const [restartToken, setRestartToken] = useState(0)
  const prevBadgeCountRef = useRef(gainage.earnedBadges.length)

  useEffect(() => {
    if (!result) return
    const newlyEarned = gainage.earnedBadges.slice(prevBadgeCountRef.current)
    if (newlyEarned.length > 0 && result.newBadges.length === 0) {
      setResult(r => (r ? { ...r, newBadges: newlyEarned } : r))
    }
  }, [gainage.earnedBadges, result])

  if (!hydrated) return (
    <div className="app-content-page flex items-center justify-center" style={{ minHeight: '75dvh' }}>
      <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
    </div>
  )

  const handleStarted = () => {
    saveDraftSession({
      id: `draft_${Date.now()}`,
      mode: 'free',
      startedAt: new Date().toISOString(),
      plannedDurationSeconds: 0,
      plannedSetCount: 1,
      restSeconds: gainage.settings.restSeconds,
      programId: null,
      programSessionIndex: null,
      variant: 'forearm',
    })
  }

  const handleComplete = (sets: PlankSet[], durationSeconds: number, restSeconds: number, status: 'completed' | 'interrupted', config: PlankFreeConfig) => {
    recordSession({
      mode: 'free',
      plannedDurationSeconds: sets.reduce((s, x) => s + x.targetSeconds, 0),
      actualDurationSeconds: durationSeconds,
      plannedSetCount: sets.length,
      sets,
      restSeconds,
      status,
    })
    const totalHold = sets.filter(s => s.status === 'completed').reduce((s, x) => s + x.actualSeconds, 0)
    setLastConfig(config)
    setResult({ totalHold, newBadges: [] })
  }

  const handleRestart = () => {
    setRestartToken(t => t + 1)
    setResult(null)
  }

  if (result) {
    const badgeDetails = ALL_PLANK_BADGES.filter(b => result.newBadges.includes(b.id))
    return (
      <div className="app-content-page bg-white flex flex-col items-center justify-center gap-5 text-center px-6">
        <p className="text-2xl font-bold text-gray-900">Séance enregistrée</p>
        <p className="text-gray-500">{formatPlankGoal(result.totalHold)} de maintien au total</p>
        {badgeDetails.length > 0 && (
          <Card className="bg-amber-50 border-amber-200 w-full max-w-xs">
            <p className="text-sm font-semibold text-amber-800 mb-2">Nouveau badge !</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {badgeDetails.map(b => (
                <span key={b.id} className="flex items-center gap-1 bg-white rounded-full px-2.5 py-1 text-xs font-medium text-amber-800">
                  {b.icon} {b.name}
                </span>
              ))}
            </div>
          </Card>
        )}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button size="xl" variant="secondary" className="bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:bg-emerald-700" onClick={handleRestart}>Recommencer cette séance</Button>
          <Button size="xl" onClick={() => router.push('/gainage')}>Retour à l&apos;accueil</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-content-page bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <h1 className="font-black text-xl text-gray-900">Séance libre</h1>
      </div>
      <div className="flex-1 flex flex-col pt-2 px-4 pb-8 page-scroll-gutter">
        <FreeSessionRunner
          key={restartToken}
          baseSettings={gainage.settings}
          initialConfig={restartToken > 0 ? lastConfig ?? undefined : undefined}
          autoStart={restartToken > 0}
          onStarted={handleStarted}
          onComplete={handleComplete}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  )
}
