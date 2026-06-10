'use client'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { InitialTest } from '@/components/InitialTest'
import { useAppData } from '@/hooks/useWorkoutProgram'

function TestPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data, startProgram, setProfile } = useAppData()

  const name = searchParams.get('name') ?? 'Athlète'

  const handleComplete = (score: number) => {
    setProfile(name, score)
    startProgram(score)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-14 pb-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <div>
          <h1 className="font-black text-xl text-gray-900">Test initial</h1>
          <p className="text-xs text-gray-500">Fais ton maximum en une seule série</p>
        </div>
      </div>
      <div className="flex-1 px-4 pb-8">
        <InitialTest onComplete={handleComplete} />
      </div>
    </div>
  )
}

export default function TestPage() {
  return (
    <Suspense>
      <TestPageInner />
    </Suspense>
  )
}
