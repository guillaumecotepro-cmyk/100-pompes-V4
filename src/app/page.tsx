'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronRight, Dumbbell, Timer, Flame, Trophy, Settings, Bell, X, User } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { useAppData } from '@/hooks/useWorkoutProgram'
import { getNextSession, getProgressPercent } from '@/lib/programGenerator'
import { getNextPlankProgramSession, getPlankProgramProgress } from '@/lib/plank/programGenerator'
import { computePlankStreak } from '@/lib/plank/stats'
import { formatPlankGoal, formatDurationHMS } from '@/lib/plank/format'
import { computePlankTotals } from '@/lib/plank/stats'
import { computeCombinedStreak, computeCombinedWeekSummary } from '@/lib/combined'
import { shouldShowReminder } from '@/lib/reminders'
import { isToday } from '@/lib/utils'

export default function ActivityChooserPage() {
  const router = useRouter()
  const { data, hydrated } = useAppData()
  const [reminderDismissed, setReminderDismissed] = useState(false)
  const notifiedRef = useRef(false)

  const combinedStreak = useMemo(() => hydrated ? computeCombinedStreak(data) : null, [hydrated, data])
  const weekSummary = useMemo(() => hydrated ? computeCombinedWeekSummary(data) : null, [hydrated, data])

  const pompesDoneToday = hydrated && data.history.some(h => h.completed && isToday(h.date))
  const gainageDoneToday = hydrated && data.gainage.sessions.some(s => s.status === 'completed' && isToday(s.date))
  const reminderDue = hydrated && shouldShowReminder(data.reminders, { pompes: pompesDoneToday, gainage: gainageDoneToday })

  useEffect(() => {
    if (!reminderDue || notifiedRef.current) return
    notifiedRef.current = true
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('100 Pompes', { body: 'Petit rappel : ta séance du jour t\'attend 💪', icon: '/icon-192.png' })
    }
  }, [reminderDue])

  if (!hydrated) return (
    <div className="app-content-page flex items-center justify-center" style={{ minHeight: '75dvh' }}>
      <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
  )

  const pompesOnboarded = data.onboarded
  const nextPompesSession = data.program ? getNextSession(data.program) : null
  const pompesProgressPct = data.program ? getProgressPercent(data.program) : 0

  const gainage = data.gainage
  const activeProgram = gainage.programs.find(p => p.id === gainage.activeProgramId && p.status === 'active') ?? null
  const nextPlankSession = activeProgram ? getNextPlankProgramSession(activeProgram) : null
  const plankProgressPct = activeProgram ? getPlankProgramProgress(activeProgram) : 0
  const { currentStreak } = computePlankStreak(gainage.sessions)
  const lastPlankSession = gainage.sessions[0] ?? null

  // Totaux cumulés toutes activités (programme + libre) pour le bandeau de bas de page.
  const totalPushupsCumulated = data.stats.totalPushups
  const totalGainageSeconds = computePlankTotals(gainage.sessions).totalHoldSeconds

  return (
    <main className="app-content-page flex flex-col px-4 pt-8 pb-10 gap-5 max-w-md mx-auto w-full">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative text-center mb-1">
        <h1 className="text-2xl font-black text-gray-900">Choisis ton activité</h1>
        <p className="text-sm text-gray-500 mt-1">Tu peux basculer entre les deux à tout moment.</p>
        <div className="absolute right-0 top-0 flex items-center gap-1">
          <Link href="/profile" aria-label="Mon profil" className="p-2 rounded-xl hover:bg-gray-100">
            <User size={18} className="text-gray-400" />
          </Link>
          <Link href="/account" aria-label="Compte et réglages" className="p-2 rounded-xl hover:bg-gray-100">
            <Settings size={18} className="text-gray-400" />
          </Link>
        </div>
      </motion.div>

      {reminderDue && !reminderDismissed && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-amber-50 border-amber-200 flex items-center gap-3">
            <Bell size={18} className="text-amber-600 shrink-0" />
            <p className="flex-1 text-xs text-amber-800">Petit rappel : ta séance du jour t&apos;attend.</p>
            <button onClick={() => setReminderDismissed(true)} aria-label="Fermer" className="text-amber-400">
              <X size={16} />
            </button>
          </Card>
        </motion.div>
      )}

      {combinedStreak && weekSummary && (combinedStreak.currentStreak > 0 || weekSummary.activeDaysThisWeek > 0) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}>
          <Link href="/profile">
            <Card className="bg-gray-900 text-white flex items-center justify-around py-3 hover:bg-gray-800 transition-colors">
              <div className="text-center">
                <p className="text-xl font-black">{combinedStreak.currentStreak}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wide">jour{combinedStreak.currentStreak > 1 ? 's' : ''} de suite</p>
              </div>
              <div className="w-px h-8 bg-white/15" />
              <div className="text-center">
                <p className="text-xl font-black">{weekSummary.activeDaysThisWeek}/7</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wide">jours cette semaine</p>
              </div>
              <div className="w-px h-8 bg-white/15" />
              <div className="flex items-center gap-1 text-white/70 text-xs font-semibold">
                Profil <ChevronRight size={14} />
              </div>
            </Card>
          </Link>
        </motion.div>
      )}

      {/* ── Carte Pompes ── */}
      <motion.button
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        onClick={() => router.push(pompesOnboarded ? '/dashboard' : '/onboarding')}
        className="text-left"
      >
        <Card elevated padding="lg" className="border-2 border-brand-100 hover:border-brand-300 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-brand-500 flex items-center justify-center shrink-0 shadow-md shadow-brand-200">
              <Dumbbell size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-black text-lg text-gray-900">Pompes</p>
              <p className="text-xs text-gray-500">Programme, séance libre et progression</p>
            </div>
            <ChevronRight size={20} className="text-gray-300 shrink-0" />
          </div>

          {pompesOnboarded ? (
            nextPompesSession ? (
              <div className="mt-2">
                <Progress value={pompesProgressPct} height="sm" className="mb-2" />
                <p className="text-xs text-gray-500">
                  Prochaine séance : Semaine {nextPompesSession.week} · Séance {nextPompesSession.day} — {nextPompesSession.totalTarget} pompes
                </p>
              </div>
            ) : (
              <p className="text-xs text-emerald-600 font-semibold mt-1">Programme terminé 🎉</p>
            )
          ) : (
            <p className="text-xs font-semibold text-brand-600 mt-1">Commencer →</p>
          )}
        </Card>
      </motion.button>

      {/* ── Carte Gainage ── */}
      <motion.button
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        onClick={() => router.push(gainage.onboarded ? '/gainage' : '/gainage/onboarding')}
        className="text-left"
      >
        <Card elevated padding="lg" className="border-2 border-teal-100 hover:border-teal-300 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-teal-700 flex items-center justify-center shrink-0 shadow-md shadow-teal-200">
              <Timer size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-black text-lg text-gray-900">Gainage</p>
              <p className="text-xs text-gray-500">Programme, séance libre et progression</p>
            </div>
            <ChevronRight size={20} className="text-gray-300 shrink-0" />
          </div>

          {gainage.onboarded ? (
            <div className="mt-2 flex flex-col gap-1.5">
              {nextPlankSession && (
                <>
                  <Progress value={plankProgressPct} height="sm" color="bg-teal-600" className="mb-1" />
                  <p className="text-xs text-gray-500">
                    Prochaine séance : Semaine {nextPlankSession.week} · Jour {nextPlankSession.day}
                  </p>
                </>
              )}
              <div className="flex items-center gap-3 mt-0.5">
                {currentStreak > 0 && (
                  <span className="flex items-center gap-1 text-xs text-teal-700 font-semibold bg-teal-50 px-2 py-1 rounded-full">
                    <Flame size={12} /> {currentStreak} j
                  </span>
                )}
                {lastPlankSession && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Trophy size={12} className="text-amber-500" /> Dernière : {formatPlankGoal(lastPlankSession.totalHoldSeconds)}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs font-semibold text-teal-700 mt-1">Commencer →</p>
          )}
        </Card>
      </motion.button>

      {/* ── Totaux cumulés (toutes activités, programme + libre) ── */}
      {(totalPushupsCumulated > 0 || totalGainageSeconds > 0) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-2">Cumul depuis le début</p>
          <div className="grid grid-cols-2 gap-3">
            <Card className="text-center">
              <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center mx-auto mb-1.5">
                <Dumbbell size={15} className="text-brand-500" />
              </div>
              <p className="text-lg font-black text-gray-900">{totalPushupsCumulated.toLocaleString('fr')}</p>
              <p className="text-[10px] text-gray-500">pompes au total</p>
            </Card>
            <Card className="text-center">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center mx-auto mb-1.5">
                <Timer size={15} className="text-teal-700" />
              </div>
              <p className="text-lg font-black text-gray-900">{formatDurationHMS(totalGainageSeconds)}</p>
              <p className="text-[10px] text-gray-500">de gainage au total</p>
            </Card>
          </div>
        </motion.div>
      )}
    </main>
  )
}
