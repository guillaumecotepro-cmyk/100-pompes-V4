'use client'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { SensorCalibration } from '@/components/SensorCalibration'
import { useAppData } from '@/hooks/useWorkoutProgram'
import { SensorMode } from '@/types'

function CalibrationPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data, setSensorMode } = useAppData()

  // name may be passed during onboarding flow, or absent when coming from settings
  const name = searchParams.get('name')
  const fromSettings = !name

  const handleComplete = (mode: SensorMode) => {
    setSensorMode(mode)
    if (fromSettings) {
      router.back()
    } else {
      router.push(`/test?name=${encodeURIComponent(name ?? 'Athlète')}`)
    }
  }

  return (
    <div className="app-content-page bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <div>
          <h1 className="font-black text-xl text-gray-900">
            {fromSettings ? 'Mode de comptage' : 'Calibration'}
          </h1>
          <p className="text-xs text-gray-500">Comment veux-tu compter tes pompes ?</p>
        </div>
      </div>
      <div className="flex-1 px-4 page-scroll-gutter">
        <SensorCalibration
          initialMode={data.preferredSensorMode}
          onComplete={handleComplete}
        />
      </div>
    </div>
  )
}

export default function CalibrationPage() {
  return (
    <Suspense>
      <CalibrationPageInner />
    </Suspense>
  )
}
