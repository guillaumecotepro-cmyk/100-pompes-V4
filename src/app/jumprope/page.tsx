'use client'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Play, Target, Flame, Trophy, Clock, History, BarChart2, Award, Settings, ChevronRight, CalendarCheck } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Navigation } from '@/components/Navigation'
import { useJumpRopeData } from '@/hooks/rope/useJumpRopeData'
import { getJumpProgram } from '@/lib/rope/programs'
import { getNextWorkout, getProgramProgressPercent } from '@/lib/rope/programProgress'
import { computeJumpTotals, computeJumpStreak, computeBestSessionJumps } from '@/lib/rope/stats'
import { getChallenge7State } from '@/lib/rope/challenge'
import { formatDurationHMS, formatJumps } from '@/lib/rope/format'

export default function JumpRopeDashboardPage() {
  const router = useRouter()
  const { hydrated, jumprope, saveDraftSession } = useJumpRopeData()

  useEffect(() => {
    if (hydrated && !jumprope.onboarded) router.replace('/jumprope/onboarding')
  }, [hydrated, jumprope.onboarded, router])

  if (!hydrated || !jumprope.onboarded) return (
    <div className="app-page flex items-center justify-center" style={{ minHeight: '75dvh' }}>
      <div className="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
    </div>
  )

  const activeProgram = jumprope.activeProgramId ? getJumpProgram(jumprope.activeProgramId) : null
  const activeProgress = jumprope.activeProgramId ? jumprope.programProgress[jumprope.activeProgramId] : null
  const nextWorkout = activeProgram ? getNextWorkout(activeProgram, activeProgress) : null
  const progressPct = activeProgram ? getProgramProgressPercent(activeProgram, activeProgress) : 0

  const { currentStreak, bestStreak } = computeJumpStreak(jumprope.sessions)
  const totals = computeJumpTotals(jumprope.sessions)
  const bestSession = computeBestSessionJumps(jumprope.sessions)
  const draft = jumprope.draftSession

  const challenge7Active = jumprope.challenge7.status === 'active'
  const challenge7State = challenge7Active ? getChallenge7State(jumprope.sessions) : []
  const challenge7Next = challenge7State.find(d => !d.completed)

  return (
    <div className="app-page bg-gray-50">
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100">
        <h1 className="text-2xl font-black text-gray-900">Corde à sauter</h1>
        <div className="flex items-center gap-2 mt-2">
          {currentStreak > 0 && (
            <span className="flex items-center gap-1 text-xs text-violet-700 font-semibold bg-violet-50 px-2.5 py-1 rounded-full">
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
                onClick={() => router.push('/jumprope/session')}
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

        {challenge7Active && challenge7Next && (
          <Link href="/jumprope/challenge">
            <Card className="border-2 border-violet-200 bg-violet-50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
                <CalendarCheck size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Défi 7 jours — Jour {challenge7Next.day}</p>
                <p className="text-xs text-violet-700">{formatJumps(challenge7Next.achievedJumps)} / {formatJumps(challenge7Next.targetJumps)} sauts</p>
              </div>
              <ChevronRight size={18} className="text-violet-400" />
            </Card>
          </Link>
        )}

        {/* ── Programme ── */}
        <Card elevated>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-gray-500">Programme</p>
              <p className="font-bold text-gray-900">{activeProgram ? activeProgram.name : 'Aucun programme actif'}</p>
            </div>
            {activeProgram && <span className="text-2xl font-black text-violet-600">{progressPct}%</span>}
          </div>
          {activeProgram && <Progress value={progressPct} height="lg" color="bg-violet-600" animated />}
          {nextWorkout ? (
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-500">{nextWorkout.title}</p>
              <button
                onClick={() => router.push(`/jumprope/session?mode=program&workout=${nextWorkout.index}`)}
                className="w-11 h-11 rounded-2xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-200 shrink-0"
              >
                <Play size={18} className="text-white ml-0.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/jumprope/programs')}
              className="mt-3 w-full h-11 rounded-xl bg-violet-600 text-white text-sm font-bold flex items-center justify-center gap-2"
            >
              {activeProgram ? 'Programme terminé — choisir un nouveau programme' : 'Choisir un programme'} <ChevronRight size={16} />
            </button>
          )}
        </Card>

        {/* ── Actions rapides ── */}
        <Link href="/jumprope/start">
          <Card className="flex items-center justify-center gap-2 py-4 text-center bg-violet-600 hover:bg-violet-700 transition-colors">
            <Play size={20} className="text-white" />
            <p className="text-sm font-bold text-white">Commencer une séance</p>
          </Card>
        </Link>

        {/* ── Stats rapides ── */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-xs text-gray-500 flex items-center gap-1"><Trophy size={12} className="text-amber-500" /> Meilleure séance</p>
            <p className="text-2xl font-black text-gray-900">{formatJumps(bestSession)}<span className="text-xs text-gray-400 font-normal"> sauts</span></p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12} /> Temps cumulé</p>
            <p className="text-2xl font-black text-gray-900">{formatDurationHMS(totals.totalActiveDurationSeconds)}</p>
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
          { href: '/jumprope/history', Icon: History, label: 'Historique des séances' },
          { href: '/jumprope/stats', Icon: BarChart2, label: 'Statistiques' },
          { href: '/jumprope/badges', Icon: Award, label: 'Badges' },
          { href: '/jumprope/challenge', Icon: CalendarCheck, label: 'Défi 7 jours' },
          { href: '/jumprope/settings', Icon: Settings, label: 'Réglages audio et comptage' },
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

      <Navigation space="jumprope" />
    </div>
  )
}
