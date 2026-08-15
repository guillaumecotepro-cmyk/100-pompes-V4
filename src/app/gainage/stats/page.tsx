'use client'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BarChart2, Flame, Trophy } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Navigation } from '@/components/Navigation'
import { usePlankData } from '@/hooks/plank/usePlankData'
import { getPlankProgramProgress } from '@/lib/plank/programGenerator'
import { computePlankStreak, computePlankTotals, computeBestContinuousHold, computeSessionsThisWeek, buildRecordProgression } from '@/lib/plank/stats'
import { formatPlankGoal, formatClock } from '@/lib/plank/format'
import { formatDateShort } from '@/lib/utils'

export default function GainageStatsPage() {
  const router = useRouter()
  const { hydrated, gainage } = usePlankData()

  const activeProgram = gainage.programs.find(p => p.id === gainage.activeProgramId && p.status === 'active') ?? null
  const progressPct = activeProgram ? getPlankProgramProgress(activeProgram) : 0
  const { currentStreak, bestStreak } = computePlankStreak(gainage.sessions)
  const totals = computePlankTotals(gainage.sessions)
  const bestHold = computeBestContinuousHold(gainage.sessions, gainage.tests)
  const sessionsThisWeek = computeSessionsThisWeek(gainage.sessions)

  const chartData = useMemo(() => {
    const progression = buildRecordProgression(gainage.sessions, gainage.tests)
    return progression.slice(-20).map(p => ({ date: formatDateShort(p.date), record: p.seconds }))
  }, [gainage.sessions, gainage.tests])

  if (!hydrated) return null

  return (
    <div className="app-page bg-gray-50">
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100">
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <BarChart2 size={20} className="text-teal-600" /> Statistiques Gainage
        </h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {activeProgram && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card elevated>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-gray-500">Programme actif</p>
                  <p className="font-bold text-gray-900">Objectif {formatPlankGoal(activeProgram.goalSeconds)}</p>
                </div>
                <span className="text-2xl font-black text-teal-600">{progressPct}%</span>
              </div>
              <Progress value={progressPct} height="lg" color="bg-teal-600" animated />
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Card><p className="text-xs text-gray-500 flex items-center gap-1"><Trophy size={12} className="text-amber-500" /> Record continu</p><p className="text-2xl font-black text-gray-900">{formatPlankGoal(bestHold)}</p></Card>
          <Card><p className="text-xs text-gray-500">Temps cumulé</p><p className="text-2xl font-black text-gray-900">{formatPlankGoal(totals.totalHoldSeconds)}</p></Card>
          <Card><p className="text-xs text-gray-500">Séances terminées</p><p className="text-2xl font-black text-gray-900">{totals.totalSessions}</p></Card>
          <Card><p className="text-xs text-gray-500">Durée moyenne</p><p className="text-2xl font-black text-gray-900">{formatPlankGoal(totals.averageDurationSeconds)}</p></Card>
          <Card><p className="text-xs text-gray-500 flex items-center gap-1"><Flame size={12} /> Série actuelle</p><p className="text-2xl font-black text-gray-900">{currentStreak}<span className="text-xs text-gray-400 font-normal"> j</span></p></Card>
          <Card><p className="text-xs text-gray-500">Meilleure série</p><p className="text-2xl font-black text-gray-900">{bestStreak}<span className="text-xs text-gray-400 font-normal"> j</span></p></Card>
          <Card className="col-span-2"><p className="text-xs text-gray-500">Séances cette semaine</p><p className="text-2xl font-black text-gray-900">{sessionsThisWeek}</p></Card>
        </div>

        {chartData.length >= 2 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <p className="text-sm font-semibold text-gray-700 mb-3">Progression du record</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => formatClock(v)} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                    formatter={(v: number) => [formatPlankGoal(v), 'Record']}
                  />
                  {bestHold > 0 && <ReferenceLine y={bestHold} stroke="#0f766e" strokeDasharray="4 3" />}
                  <Line type="monotone" dataKey="record" stroke="#0f766e" strokeWidth={2.5}
                    dot={{ r: 3, fill: '#0f766e', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#0f766e' }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        )}

        {totals.totalSessions === 0 && (
          <Card className="text-center py-10">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-gray-500 text-sm">Termine une première séance pour voir tes statistiques.</p>
          </Card>
        )}
      </div>
      <Navigation space="gainage" />
    </div>
  )
}
