'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { PlankGuideCard } from '@/components/gainage/PlankGuideCard'

export default function PlankGuidePage() {
  const router = useRouter()
  return (
    <div className="app-content-page bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <h1 className="font-black text-xl text-gray-900">Bien réaliser la planche</h1>
      </div>
      <div className="flex-1 px-4 pb-8 page-scroll-gutter">
        <PlankGuideCard />
      </div>
    </div>
  )
}
