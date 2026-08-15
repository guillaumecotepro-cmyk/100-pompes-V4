'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, Award } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Navigation } from '@/components/Navigation'
import { usePlankData } from '@/hooks/plank/usePlankData'
import { ALL_PLANK_BADGES } from '@/lib/plank/badges'

export default function GainageBadgesPage() {
  const router = useRouter()
  const { hydrated, gainage } = usePlankData()

  if (!hydrated) return null

  const badges = ALL_PLANK_BADGES.map(b => ({ ...b, earned: gainage.earnedBadges.includes(b.id) }))

  return (
    <div className="app-page bg-gray-50">
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Award size={20} className="text-amber-500" /> Badges Gainage
        </h1>
        <span className="ml-auto text-xs text-gray-400">{gainage.earnedBadges.length} / {ALL_PLANK_BADGES.length}</span>
      </div>

      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        {badges.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
            <Card className={`text-center flex flex-col items-center gap-1 ${b.earned ? '' : 'opacity-40 grayscale'}`}>
              <span className="text-3xl">{b.icon}</span>
              <p className="text-xs font-bold text-gray-900">{b.name}</p>
              <p className="text-[10px] text-gray-500">{b.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>
      <Navigation space="gainage" />
    </div>
  )
}
