'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Play, Calendar, Trophy, Flame, Zap, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Navigation } from '@/components/Navigation'
import { useAppData } from '@/hooks/useWorkoutProgram'
import { getNextSession, getProgressPercent, ALL_BADGES } from '@/lib/programGenerator'
import { getLevelLabel, getLevelBadgeClass, formatDate, formatDateShort, isToday } from '@/lib/utils'
import { getRandomQuote, getStreakMessage } from '@/lib/motivation'

export default function DashboardPage() {
  const router = useRouter()
  const { data, hydrated } = useAppData()
  const quote = getRandomQuote()

  useEffect(() => {
    if (hydrated && !data.onboarded) router.replace('/')
  }, [hydrated, data.onboarded, router])

  if (!hydrated || !data.profile) return null

  const { profile, stats, program, history, maxHistory = [], earnedBadges } = data
  const nextSession       = program ? getNextSession(program) : null
  const progressPct       = program ? getProgressPercent(program) : 0
  const alreadyWorkedToday = history.length > 0 && isToday(history[0].date)
  const recentHistory     = history.slice(0, 5)
  const earnedBadgeDetails = ALL_BADGES.filter(b => earnedBadges.includes(b.id))

  // Max performance stats
  const maxPR          = maxHistory.length > 0 ? Math.max(...maxHistory.map(r => r.reps)) : stats.bestSingleSet
  const lastMax        = maxHistory[0] ?? null
  const recentMaxes    = maxHistory.slice(0, 3)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Bonjour,</p>
            <h1 className="text-2xl font-black text-gray-900">{profile.name} 👋</h1>
          </div>
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-lg"
            style={{ backgroundColor: profile.avatarColor }}>
            {profile.name[0].toUpperCase()}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getLevelBadgeClass(profile.level)}`}>
            {getLevelLabel(profile.level)}
          </span>
          {stats.currentStreak > 0 && (
            <span className="flex items-center gap-1 text-xs text-brand-600 font-semibold bg-brand-50 px-2.5 py-1 rounded-full">
              <Flame size={12} /> {stats.currentStreak} jours
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">

        {/* ── Objectif 100 pompes ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card elevated>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-gray-500">Objectif global</p>
                <p className="font-bold text-gray-900">100 Pompes d'affilée</p>
              </div>
              <span className="text-2xl font-black text-brand-500">{progressPct}%</span>
            </div>
            <Progress value={progressPct} height="lg" animated />
            {nextSession && (
              <p className="text-xs text-gray-400 mt-2">
                Semaine {nextSession.week} · Séance {nextSession.day}
              </p>
            )}
          </Card>
        </motion.div>

        {/* ── Performance Max card ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                  <Zap size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-700">Performance Max</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-gray-900">{maxPR}</span>
                    <span className="text-xs text-gray-500">pompes · record</span>
                  </div>
                  {lastMax && (
                    <p className="text-xs text-amber-700 mt-0.5">
                      Dernier : {lastMax.reps} le {formatDateShort(lastMax.date)}
                    </p>
                  )}
                </div>
              </div>
              <Link href="/max">
                <button className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-md shadow-amber-200 shrink-0">
                  <Play size={20} className="text-white ml-0.5" />
                </button>
              </Link>
            </div>

            {/* Mini history sparkline */}
            {recentMaxes.length > 1 && (
              <div className="mt-3 flex items-end gap-1.5 h-8">
                {recentMaxes.slice().reverse().map((r, i) => {
                  const pct = maxPR > 0 ? (r.reps / maxPR) * 100 : 50
                  return (
                    <div key={r.id} className="flex-1 flex flex-col items-center gap-0.5">
                      <div
                        className="w-full rounded-t-sm bg-amber-400 transition-all"
                        style={{ height: `${Math.max(pct, 10)}%` }}
                      />
                      <span className="text-[8px] text-amber-600 font-medium">{r.reps}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </motion.div>

        {/* ── CTA Séance programme ── */}
        {nextSession && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className={`border-2 ${alreadyWorkedToday ? 'border-emerald-200 bg-emerald-50' : 'border-brand-200 bg-brand-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    {alreadyWorkedToday ? 'Séance du jour ✓' : 'Prochaine séance'}
                  </p>
                  <p className="font-bold text-gray-900">
                    {nextSession.sets.length} séries · {nextSession.totalTarget} pompes
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{nextSession.focus}</p>
                </div>
                {!alreadyWorkedToday && (
                  <Link href="/workout">
                    <button className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center shadow-md shadow-brand-200 shrink-0">
                      <Play size={20} className="text-white ml-0.5" />
                    </button>
                  </Link>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Stats grid ── */}
        <motion.div className="grid grid-cols-2 gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <Card>
            <p className="text-xs text-gray-500">Total pompes</p>
            <p className="text-2xl font-black text-gray-900">{stats.totalPushups.toLocaleString('fr')}</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500">Meilleure série</p>
            <p className="text-2xl font-black text-gray-900">{stats.bestSingleSet}</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500">Séances</p>
            <p className="text-2xl font-black text-gray-900">{stats.totalSessions}</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500">Meilleur streak</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-black text-gray-900">{stats.bestStreak}</p>
              <p className="text-xs text-gray-400">jours</p>
            </div>
          </Card>
        </motion.div>

        {/* ── Streak message ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100">
            <p className="text-sm font-medium text-orange-800">{getStreakMessage(stats.currentStreak)}</p>
          </Card>
        </motion.div>

        {/* ── Badges ── */}
        {earnedBadgeDetails.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            <Card>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Trophy size={15} className="text-amber-500" /> Badges
                </p>
                <span className="text-xs text-gray-400">{earnedBadgeDetails.length}/{ALL_BADGES.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {earnedBadgeDetails.map(b => (
                  <div key={b.id} title={b.description}
                    className="flex items-center gap-1 bg-amber-50 rounded-full px-2.5 py-1">
                    <span>{b.icon}</span>
                    <span className="text-xs font-medium text-amber-800">{b.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Historique récent programme ── */}
        {recentHistory.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Card>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Calendar size={15} className="text-gray-400" /> Historique récent
                </p>
                <Link href="/history" className="text-xs text-brand-500 font-medium">Voir tout</Link>
              </div>
              <div className="flex flex-col">
                {recentHistory.map(h => (
                  <div key={h.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Sem. {h.week} · J{h.day}</p>
                      <p className="text-xs text-gray-400">{formatDate(h.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{h.totalReps} <span className="text-xs text-gray-400 font-normal">pompes</span></p>
                      <p className={`text-xs ${h.completed ? 'text-emerald-500' : 'text-orange-500'}`}>
                        {h.completed ? '✓ Complété' : `${Math.round((h.totalReps / h.targetReps) * 100)}%`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Quote ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <Card className="bg-gray-50 border-none">
            <p className="text-sm italic text-gray-600">« {quote.quote} »</p>
            <p className="text-xs text-gray-400 mt-1 text-right">— {quote.author}</p>
          </Card>
        </motion.div>
      </div>

      <Navigation />
    </div>
  )
}
