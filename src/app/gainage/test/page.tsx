'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { PlankTestRunner } from '@/components/gainage/PlankTestRunner'
import { usePlankData } from '@/hooks/plank/usePlankData'

export default function GainageTestPage() {
  const router = useRouter()
  const { hydrated, gainage, recordTest, startProgram } = usePlankData()

  if (!hydrated) return (
    <div className="app-content-page flex items-center justify-center" style={{ minHeight: '75dvh' }}>
      <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
    </div>
  )

  const handleComplete = (durationSeconds: number, goalSeconds: number) => {
    recordTest(durationSeconds)
    startProgram(goalSeconds, durationSeconds)
    router.push('/gainage')
  }

  return (
    <div className="app-content-page bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <div>
          <h1 className="font-black text-xl text-gray-900">Test initial</h1>
          <p className="text-xs text-gray-500">Tiens la planche le plus longtemps possible, sans forcer</p>
        </div>
      </div>
      <div className="flex-1 px-4 pb-8 page-scroll-gutter">
        <PlankTestRunner settings={gainage.settings} onComplete={handleComplete} />
      </div>
    </div>
  )
}
