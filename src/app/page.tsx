'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronRight, Dumbbell, Timer, Flame, Trophy } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { useAppData } from '@/hooks/useWorkoutProgram'
import { getNextSession, getProgressPercent } from '@/lib/programGenerator'
import { getNextPlankProgramSession, getPlankProgramProgress } from '@/lib/plank/programGenerator'
import { computePlankStreak } from '@/lib/plank/stats'
import { formatPlankGoal } from '@/lib/plank/format'

export default function ActivityChooserPage() {
  const router = useRouter()
  const { data, hydrated } = useAppData()

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

  return (
    <main className="app-content-page flex flex-col px-4 pt-8 pb-10 gap-5 max-w-md mx-auto w-full">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-1">
        <h1 className="text-2xl font-black text-gray-900">Choisis ton activité</h1>
        <p className="text-sm text-gray-500 mt-1">Tu peux basculer entre les deux à tout moment.</p>
      </motion.div>

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
    </main>
  )
}
