'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Timer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { usePlankData } from '@/hooks/plank/usePlankData'

export default function GainageOnboardingPage() {
  const router = useRouter()
  const { setOnboarded } = usePlankData()

  const goTest = () => { setOnboarded(); router.push('/gainage/test') }
  const skip = () => { setOnboarded(); router.push('/gainage') }

  return (
    <div className="app-content-page bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => router.push('/')} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
      </div>

      <div className="flex-1 px-5 pt-2 flex flex-col gap-6 page-scroll-gutter">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-teal-700 flex items-center justify-center shadow-lg shadow-teal-200">
            <Timer size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">Bienvenue dans Gainage</h1>
          <p className="text-gray-500">Un module indépendant, pour renforcer ton tronc à ton rythme.</p>
        </div>

        <Card className="bg-teal-50 border-teal-200">
          <p className="text-sm font-semibold text-teal-800">Ce qui t&apos;attend :</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm text-teal-700">
            <li>• Un test initial pour évaluer ton niveau de gainage</li>
            <li>• Un programme progressif adapté à ton objectif</li>
            <li>• Un mode séance libre à tout moment</li>
            <li>• Voix, bips et gong pour te guider sans regarder l&apos;écran</li>
          </ul>
        </Card>
        <Card className="bg-gray-50">
          <p className="text-xs text-gray-500">
            Ce module est indépendant de Pompes : tes données pompes restent intactes, quoi que tu fasses ici.
          </p>
        </Card>

        <div className="mt-auto flex flex-col gap-2">
          <Button size="xl" fullWidth onClick={goTest}>
            Faire le test initial <ChevronRight size={20} />
          </Button>
          <Button size="md" variant="ghost" fullWidth onClick={skip}>
            Passer, aller à l&apos;accueil Gainage
          </Button>
        </div>
      </div>
    </div>
  )
}
