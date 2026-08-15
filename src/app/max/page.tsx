'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { MaxPerformanceSession } from '@/components/MaxPerformanceSession'
import { useAppData } from '@/hooks/useWorkoutProgram'

export default function MaxPage() {
  const router = useRouter()
  const { data, hydrated, saveMaxPerformance } = useAppData()

  useEffect(() => {
    if (hydrated && !data.onboarded) router.replace('/')
  }, [hydrated, data.onboarded, router])

  if (!hydrated) return (
    <div className="app-content-page flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
  )

  const personalBest = data.maxHistory && data.maxHistory.length > 0
    ? Math.max(...data.maxHistory.map(r => r.reps))
    : data.stats.bestSingleSet

  const handleComplete = (reps: number, duration: number) => {
    saveMaxPerformance(reps, duration, data.preferredSensorMode)
    router.push('/dashboard')
  }

  return (
    <div className="app-content-page bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <div>
          <h1 className="font-black text-xl text-gray-900">Performance Max</h1>
          <p className="text-xs text-gray-500">Maximum de pompes d&apos;affilée sans repos</p>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 page-scroll-gutter">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <MaxPerformanceSession
            personalBest={personalBest}
            onComplete={handleComplete}
            onAbort={() => router.back()}
          />
        </motion.div>
      </div>
    </div>
  )
}
