'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { PompesFreeSessionRunner } from '@/components/PompesFreeSessionRunner'
import { useAppData } from '@/hooks/useWorkoutProgram'
import { ALL_BADGES } from '@/lib/programGenerator'
import { PompesFreeMode, PompesFreeSet } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function PompesFreeSessionPage() {
  const router = useRouter()
  const { hydrated, data, saveFreeSession } = useAppData()
  const [result, setResult] = useState<{ totalReps: number; newBadges: string[] } | null>(null)
  const prevBadgeCountRef = useRef(data.earnedBadges.length)

  useEffect(() => {
    if (!result) return
    const newlyEarned = data.earnedBadges.slice(prevBadgeCountRef.current)
    if (newlyEarned.length > 0 && result.newBadges.length === 0) {
      setResult(r => (r ? { ...r, newBadges: newlyEarned } : r))
    }
  }, [data.earnedBadges, result])

  if (!hydrated) return (
    <div className="app-content-page flex items-center justify-center" style={{ minHeight: '75dvh' }}>
      <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
  )

  const handleComplete = (mode: PompesFreeMode, restSeconds: number, sets: PompesFreeSet[], status: 'completed' | 'interrupted') => {
    saveFreeSession({ mode, restSeconds, sets, status })
    const totalReps = sets.filter(s => s.status === 'completed').reduce((s, x) => s + x.actualReps, 0)
    setResult({ totalReps, newBadges: [] })
  }

  if (result) {
    const badgeDetails = ALL_BADGES.filter(b => result.newBadges.includes(b.id))
    return (
      <div className="app-content-page bg-white flex flex-col items-center justify-center gap-5 text-center px-6">
        <p className="text-2xl font-bold text-gray-900">Séance enregistrée</p>
        <p className="text-gray-500">{result.totalReps} pompe{result.totalReps !== 1 ? 's' : ''} au total</p>
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
        <Button size="xl" onClick={() => router.push('/dashboard')}>Retour à l&apos;accueil</Button>
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
        <PompesFreeSessionRunner
          baseSettings={data.pompesAudioSettings}
          personalBest={data.stats.bestSingleSet}
          onStarted={() => {}}
          onComplete={handleComplete}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  )
}
