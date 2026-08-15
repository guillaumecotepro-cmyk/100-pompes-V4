'use client'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Play, RotateCcw, Target, Flame, Trophy, Clock, History, BarChart2, Award, Settings, BookOpen, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Navigation } from '@/components/Navigation'
import { usePlankData } from '@/hooks/plank/usePlankData'
import { getNextPlankProgramSession, getPlankProgramProgress } from '@/lib/plank/programGenerator'
import { computePlankStreak, computePlankTotals, computeBestContinuousHold } from '@/lib/plank/stats'
import { formatPlankGoal } from '@/lib/plank/format'

export default function GainageDashboardPage() {
  const router = useRouter()
  const { hydrated, gainage, saveDraftSession } = usePlankData()

  useEffect(() => {
    if (hydrated && !gainage.onboarded) router.replace('/gainage/onboarding')
  }, [hydrated, gainage.onboarded, router])

  if (!hydrated || !gainage.onboarded) return (
    <div className="app-page flex items-center justify-center" style={{ minHeight: '75dvh' }}>
      <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
    </div>
  )

  const activeProgram = gainage.programs.find(p => p.id === gainage.activeProgramId && p.status === 'active') ?? null
  const nextSession = activeProgram ? getNextPlankProgramSession(activeProgram) : null
  const progressPct = activeProgram ? getPlankProgramProgress(activeProgram) : 0
  const { currentStreak, bestStreak } = computePlankStreak(gainage.sessions)
  const totals = computePlankTotals(gainage.sessions)
  const bestHold = computeBestContinuousHold(gainage.sessions, gainage.tests)
  const draft = gainage.draftSession

  return (
    <div className="app-page bg-gray-50">
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100">
        <h1 className="text-2xl font-black text-gray-900">Gainage</h1>
        <div className="flex items-center gap-2 mt-2">
          {currentStreak > 0 && (
            <span className="flex items-center gap-1 text-xs text-teal-700 font-semibold bg-teal-50 px-2.5 py-1 rounded-full">
              <Flame size={12} /> {currentStreak} jour{currentStreak > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {draft && (
          <Card className="border-2 border-amber-300 bg-amber-50">
            <p className="text-sm font-semibold text-amber-900">Séance en cours non terminée</p>
            <p className="text-xs text-amber-700 mt-0.5">Reprends-la ou abandonne-la proprement.</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => router.push(draft.mode === 'program' ? '/gainage/session' : '/gainage/free')}
                className="flex-1 h-10 rounded-xl bg-amber-500 text-white text-sm font-bold"
              >
                Reprendre
              </button>
              <button
                onClick={() => saveDraftSession(null)}
                className="flex-1 h-10 rounded-xl bg-white border border-amber-300 text-amber-700 text-sm font-bold"
              >
                Abandonner
              </button>
            </div>
          </Card>
        )}

        {/* ── Programme ── */}
        <Card elevated>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-gray-500">Programme</p>
              <p className="font-bold text-gray-900">
                {activeProgram ? `Objectif ${formatPlankGoal(activeProgram.goalSeconds)}` : 'Aucun programme actif'}
              </p>
            </div>
            {activeProgram && <span className="text-2xl font-black text-teal-600">{progressPct}%</span>}
          </div>
          {activeProgram && <Progress value={progressPct} height="lg" color="bg-teal-600" animated />}
          {nextSession ? (
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-500">
                Semaine {nextSession.week} · Jour {nextSession.day} · {nextSession.sets.length} série{nextSession.sets.length > 1 ? 's' : ''}
              </p>
              <button
                onClick={() => router.push('/gainage/session')}
                className="w-11 h-11 rounded-2xl bg-teal-600 flex items-center justify-center shadow-md shadow-teal-200 shrink-0"
              >
                <Play size={18} className="text-white ml-0.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/gainage/program')}
              className="mt-3 w-full h-11 rounded-xl bg-teal-600 text-white text-sm font-bold flex items-center justify-center gap-2"
            >
              {activeProgram ? 'Programme terminé — choisir un nouvel objectif' : 'Commencer un programme'} <ChevronRight size={16} />
            </button>
          )}
        </Card>

        {/* ── Actions rapides ── */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/gainage/free">
            <Card className="flex flex-col items-center justify-center py-5 text-center hover:bg-gray-50 transition-colors">
              <Play size={22} className="text-teal-600 mb-1.5" />
              <p className="text-sm font-bold text-gray-900">Séance libre</p>
            </Card>
          </Link>
          <Link href="/gainage/test">
            <Card className="flex flex-col items-center justify-center py-5 text-center hover:bg-gray-50 transition-colors">
              <RotateCcw size={22} className="text-teal-600 mb-1.5" />
              <p className="text-sm font-bold text-gray-900">{gainage.tests.length > 0 ? 'Refaire le test' : 'Faire le test'}</p>
            </Card>
          </Link>
        </div>

        {/* ── Stats rapides ── */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-xs text-gray-500 flex items-center gap-1"><Trophy size={12} className="text-amber-500" /> Record</p>
            <p className="text-2xl font-black text-gray-900">{formatPlankGoal(bestHold)}</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12} /> Cumulé</p>
            <p className="text-2xl font-black text-gray-900">{formatPlankGoal(totals.totalHoldSeconds)}</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500 flex items-center gap-1"><Flame size={12} /> Meilleure série</p>
            <p className="text-2xl font-black text-gray-900">{bestStreak}<span className="text-xs text-gray-400 font-normal"> j</span></p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500 flex items-center gap-1"><Target size={12} /> Séances</p>
            <p className="text-2xl font-black text-gray-900">{totals.totalSessions}</p>
          </Card>
        </div>

        {/* ── Liens ── */}
        {[
          { href: '/gainage/history',  Icon: History,   label: 'Historique des séances' },
          { href: '/gainage/stats',    Icon: BarChart2, label: 'Statistiques' },
          { href: '/gainage/badges',   Icon: Award,     label: 'Badges' },
          { href: '/gainage/guide',    Icon: BookOpen,  label: 'Bien réaliser la planche' },
          { href: '/gainage/settings', Icon: Settings,  label: 'Réglages audio et rappels' },
        ].map(({ href, Icon, label }) => (
          <motion.div key={href} whileTap={{ scale: 0.98 }}>
            <Link href={href}>
              <Card className="flex items-center gap-3 py-3.5 hover:bg-gray-50 transition-colors">
                <Icon size={18} className="text-gray-400" />
                <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
                <ChevronRight size={16} className="text-gray-300" />
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <Navigation space="gainage" />
    </div>
  )
}
