'use client'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, BarChart2, Flame, Trophy, Zap } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card } from '@/components/ui/Card'
import { Navigation } from '@/components/Navigation'
import { useJumpRopeData } from '@/hooks/rope/useJumpRopeData'
import {
  computeJumpTotals, computeJumpStreak, computeBestSessionJumps, computeBestValidatedCadence,
  computeBestActiveDuration, computeSessionsThisWeek, buildJumpRecordProgression,
} from '@/lib/rope/stats'
import { formatDurationHMS, formatJumps, formatCadence } from '@/lib/rope/format'
import { formatDateShort } from '@/lib/utils'

export default function JumpRopeStatsPage() {
  const router = useRouter()
  const { hydrated, jumprope } = useJumpRopeData()

  const totals = useMemo(() => computeJumpTotals(jumprope.sessions), [jumprope.sessions])
  const { currentStreak, bestStreak } = useMemo(() => computeJumpStreak(jumprope.sessions), [jumprope.sessions])
  const bestSession = useMemo(() => computeBestSessionJumps(jumprope.sessions), [jumprope.sessions])
  const bestCadence = useMemo(() => computeBestValidatedCadence(jumprope.sessions), [jumprope.sessions])
  const bestActiveDuration = useMemo(() => computeBestActiveDuration(jumprope.sessions), [jumprope.sessions])
  const sessionsThisWeek = useMemo(() => computeSessionsThisWeek(jumprope.sessions), [jumprope.sessions])

  const chartData = useMemo(() => {
    const progression = buildJumpRecordProgression(jumprope.sessions)
    return progression.slice(-20).map(p => ({ date: formatDateShort(p.date), record: p.jumps }))
  }, [jumprope.sessions])

  if (!hydrated) return null

  return (
    <div className="app-page bg-gray-50">
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100">
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <BarChart2 size={20} className="text-violet-600" /> Statistiques Corde à sauter
        </h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Card><p className="text-xs text-gray-500 flex items-center gap-1"><Trophy size={12} className="text-amber-500" /> Meilleure séance</p><p className="text-2xl font-black text-gray-900">{formatJumps(bestSession)}</p></Card>
          <Card><p className="text-xs text-gray-500">Total sauts cumulés</p><p className="text-2xl font-black text-gray-900">{formatJumps(totals.totalJumps)}</p></Card>
          <Card><p className="text-xs text-gray-500">Temps actif cumulé</p><p className="text-lg font-black text-gray-900">{formatDurationHMS(totals.totalActiveDurationSeconds)}</p></Card>
          <Card><p className="text-xs text-gray-500">Séances terminées</p><p className="text-2xl font-black text-gray-900">{totals.totalSessions}</p></Card>
          <Card><p className="text-xs text-gray-500 flex items-center gap-1"><Flame size={12} /> Série actuelle</p><p className="text-2xl font-black text-gray-900">{currentStreak}<span className="text-xs text-gray-400 font-normal"> j</span></p></Card>
          <Card><p className="text-xs text-gray-500">Meilleure série</p><p className="text-2xl font-black text-gray-900">{bestStreak}<span className="text-xs text-gray-400 font-normal"> j</span></p></Card>
          <Card><p className="text-xs text-gray-500 flex items-center gap-1"><Zap size={12} /> Meilleure cadence</p><p className="text-lg font-black text-gray-900">{formatCadence(bestCadence)}</p></Card>
          <Card><p className="text-xs text-gray-500">Meilleure endurance</p><p className="text-lg font-black text-gray-900">{formatDurationHMS(bestActiveDuration)}</p></Card>
          <Card className="col-span-2"><p className="text-xs text-gray-500">Séances cette semaine</p><p className="text-2xl font-black text-gray-900">{sessionsThisWeek}</p></Card>
        </div>

        {chartData.length >= 2 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <p className="text-sm font-semibold text-gray-700 mb-3">Progression du record (sauts par séance)</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                    formatter={(v: number) => [formatJumps(v), 'Record']}
                  />
                  {bestSession > 0 && <ReferenceLine y={bestSession} stroke="#7c3aed" strokeDasharray="4 3" />}
                  <Line type="monotone" dataKey="record" stroke="#7c3aed" strokeWidth={2.5}
                    dot={{ r: 3, fill: '#7c3aed', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#7c3aed' }} />
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
      <Navigation space="jumprope" />
    </div>
  )
}
