'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, Award } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Navigation } from '@/components/Navigation'
import { useJumpRopeData } from '@/hooks/rope/useJumpRopeData'
import { ALL_JUMP_BADGES } from '@/lib/rope/badges'
import { computeJumpTotals, computeJumpStreak, computeBestSessionJumps, computeBestValidatedCadence, computeBestActiveDuration } from '@/lib/rope/stats'
import { JumpBadgeDef } from '@/types/rope'

const CATEGORY_LABELS: Record<JumpBadgeDef['category'], string> = {
  debuts: 'Premiers pas',
  volume: 'Maître du saut',
  series: 'Séries',
  grosses_seances: 'Grosses séances',
  vitesse: 'Vitesse',
  endurance: 'Endurance',
}

const TIER_LABELS: Record<NonNullable<JumpBadgeDef['tier']>, string> = { bronze: 'Bronze', argent: 'Argent', or: 'Or' }
const TIER_COLORS: Record<NonNullable<JumpBadgeDef['tier']>, string> = {
  bronze: 'text-orange-700 bg-orange-50',
  argent: 'text-gray-600 bg-gray-100',
  or: 'text-amber-700 bg-amber-50',
}

function thresholdOf(id: string): number {
  const parts = id.split('_')
  return Number(parts[parts.length - 1])
}

export default function JumpRopeBadgesPage() {
  const router = useRouter()
  const { hydrated, jumprope } = useJumpRopeData()

  if (!hydrated) return null

  const totals = computeJumpTotals(jumprope.sessions)
  const { currentStreak, bestStreak } = computeJumpStreak(jumprope.sessions)
  const bestStreakEver = Math.max(currentStreak, bestStreak)
  const bestSession = computeBestSessionJumps(jumprope.sessions)
  const bestCadence = computeBestValidatedCadence(jumprope.sessions)
  const bestActiveDuration = computeBestActiveDuration(jumprope.sessions)

  const currentValueByCategory: Record<JumpBadgeDef['category'], number> = {
    debuts: totals.totalSessions,
    volume: totals.totalJumps,
    series: bestStreakEver,
    grosses_seances: bestSession,
    vitesse: bestCadence,
    endurance: bestActiveDuration,
  }

  const badges = ALL_JUMP_BADGES.map(b => ({
    ...b,
    earned: jumprope.earnedBadges.includes(b.id),
    threshold: thresholdOf(b.id),
    current: currentValueByCategory[b.category],
  }))

  const categories = Object.keys(CATEGORY_LABELS) as JumpBadgeDef['category'][]

  return (
    <div className="app-page bg-gray-50">
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Award size={20} className="text-amber-500" /> Badges Corde à sauter
        </h1>
        <span className="ml-auto text-xs text-gray-400">{jumprope.earnedBadges.length} / {ALL_JUMP_BADGES.length}</span>
      </div>

      <div className="px-4 py-4 flex flex-col gap-6">
        {categories.map(category => (
          <div key={category}>
            <h2 className="text-sm font-bold text-gray-700 mb-2.5">{CATEGORY_LABELS[category]}</h2>
            <div className="grid grid-cols-2 gap-3">
              {badges.filter(b => b.category === category).map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <Card className={`flex flex-col items-center gap-1.5 text-center ${b.earned ? '' : 'opacity-60'}`}>
                    <span className={`text-3xl ${b.earned ? '' : 'grayscale'}`}>{b.icon}</span>
                    <p className="text-xs font-bold text-gray-900">{b.name}</p>
                    <p className="text-[10px] text-gray-500 leading-tight">{b.description}</p>
                    {b.tier && (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${TIER_COLORS[b.tier]}`}>{TIER_LABELS[b.tier]}</span>
                    )}
                    {!b.earned && (
                      <div className="w-full mt-1">
                        <Progress value={Math.min(b.current, b.threshold)} max={b.threshold} height="sm" color="bg-violet-500" animated={false} />
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Navigation space="jumprope" />
    </div>
  )
}
