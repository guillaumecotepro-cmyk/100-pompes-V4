'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ActiveWorkout } from '@/components/ActiveWorkout'
import { WorkoutSummary } from '@/components/WorkoutSummary'
import { useAppData } from '@/hooks/useWorkoutProgram'
import { CompletedSet } from '@/types'
import { getNextSession } from '@/lib/programGenerator'

type Phase = 'workout' | 'summary'

export default function WorkoutPage() {
  const router = useRouter()
  const { data, hydrated, completeSession } = useAppData()
  const [phase, setPhase]           = useState<Phase>('workout')
  const [completedSets, setCompletedSets] = useState<CompletedSet[]>([])
  const [duration, setDuration]     = useState(0)
  const [newBadges, setNewBadges]   = useState<string[]>([])

  const session = data.program ? getNextSession(data.program) : null

  useEffect(() => {
    if (hydrated && !session) router.replace('/dashboard')
  }, [hydrated, session, router])

  if (!hydrated) return (
    <div className="app-content-page flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
  )

  if (!session || !data.program) return null

  const handleWorkoutComplete = (sets: CompletedSet[], dur: number) => {
    setCompletedSets(sets)
    setDuration(dur)

    const sessionIndex = data.program!.currentSessionIndex
    completeSession(sets, sessionIndex, dur)

    const earned: string[] = []
    if (data.stats.totalSessions === 0) earned.push('first_session')
    const totalReps = sets.reduce((s, r) => s + r.completedReps, 0)
    if (totalReps >= 100 && data.stats.bestSingleSet < 100) earned.push('goal_100')
    setNewBadges(earned)

    setPhase('summary')
  }

  return (
    <div className="app-content-page bg-white flex flex-col">
      <AnimatePresence mode="wait">
        {phase === 'workout' && (
          <motion.div key="work" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex flex-col pt-6 px-4 page-scroll-gutter">
            <ActiveWorkout
              session={session}
              onComplete={handleWorkoutComplete}
              onAbort={() => router.back()}
            />
          </motion.div>
        )}

        {phase === 'summary' && (
          <motion.div key="sum" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-6 page-scroll-gutter">
            <WorkoutSummary
              sets={completedSets}
              targetReps={session.totalTarget}
              duration={duration}
              newBadges={newBadges}
              level={data.program!.level}
              onContinue={() => router.push('/dashboard')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
