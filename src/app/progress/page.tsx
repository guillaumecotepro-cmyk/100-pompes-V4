'use client'
import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TrendingUp, Zap, Play, Trophy } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Navigation } from '@/components/Navigation'
import { useAppData } from '@/hooks/useWorkoutProgram'
import { getProgressPercent } from '@/lib/programGenerator'
import { getLevelLabel, getLevelBadgeClass, formatDateShort } from '@/lib/utils'

export default function ProgressPage() {
  const router     = useRouter()
  const { data, hydrated } = useAppData()

  // ── All hooks must be called unconditionally before any early return ──
  const { stats, profile, program, history = [], maxHistory = [] } = data ?? {}

  const progressPct = program ? getProgressPercent(program) : 0

  const programChartData = useMemo(() =>
    history.slice(0, 14).reverse().map(h => ({
      date:   formatDateShort(h.date),
      pompes: h.totalReps,
      cible:  h.targetReps,
    })), [history])

  const maxChartData = useMemo(() =>
    maxHistory.slice(0, 20).reverse().map((r, i) => ({
      n:    i + 1,
      date: formatDateShort(r.date),
      reps: r.reps,
    })), [maxHistory])

  const maxPR    = maxHistory.length > 0 ? Math.max(...maxHistory.map(r => r.reps)) : 0
  const lastMax  = maxHistory[0] ?? null
  const prevMax  = maxHistory[1] ?? null
  const maxTrend = lastMax && prevMax ? lastMax.reps - prevMax.reps : null

  useEffect(() => {
    if (hydrated && !data.onboarded) router.replace('/')
  }, [hydrated, data.onboarded, router])

  if (!hydrated || !profile) return null

  return (
    <div className="app-page bg-gray-50">
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100">
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <TrendingUp size={20} className="text-brand-500" /> Progression
        </h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-5">

        {/* ── Programme progress ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card elevated>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-500">Objectif programme</p>
                <p className="font-bold text-gray-900">100 Pompes d'affilée</p>
              </div>
              <span className="text-2xl font-black text-brand-500">{progressPct}%</span>
            </div>
            <Progress value={progressPct} height="lg" animated />
            <div className="flex justify-between mt-3 text-xs text-gray-500">
              <span>Niveau : <strong className={`font-semibold ${getLevelBadgeClass(profile.level).split(' ')[1]}`}>{getLevelLabel(profile.level)}</strong></span>
              <span>Séances : {stats.totalSessions}</span>
            </div>
          </Card>
        </motion.div>

        {/* ── Performance Max section ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <Zap size={15} className="text-amber-500" /> Performance Max
            </p>
            <Link href="/max">
              <button className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                <Play size={12} /> Nouveau test
              </button>
            </Link>
          </div>

          {maxHistory.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-3xl mb-2">🏁</p>
              <p className="text-gray-500 text-sm font-medium">Aucun test encore</p>
              <p className="text-xs text-gray-400 mt-1">Lance ton premier test Performance Max !</p>
              <Link href="/max">
                <button className="mt-4 text-sm font-semibold text-amber-600 bg-amber-50 px-4 py-2 rounded-xl">
                  Commencer
                </button>
              </Link>
            </Card>
          ) : (
            <>
              {/* PR + trend */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <Card className="text-center col-span-1">
                  <Trophy size={16} className="text-amber-500 mx-auto mb-1" />
                  <p className="text-2xl font-black text-gray-900">{maxPR}</p>
                  <p className="text-xs text-gray-500">Record</p>
                </Card>
                <Card className="text-center col-span-1">
                  <p className="text-2xl font-black text-gray-900">{lastMax?.reps ?? '—'}</p>
                  <p className="text-xs text-gray-500">Dernier</p>
                </Card>
                <Card className="text-center col-span-1">
                  {maxTrend !== null ? (
                    <>
                      <p className={`text-2xl font-black ${maxTrend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {maxTrend >= 0 ? '+' : ''}{maxTrend}
                      </p>
                      <p className="text-xs text-gray-500">Évolution</p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-black text-gray-300">—</p>
                      <p className="text-xs text-gray-500">Évolution</p>
                    </>
                  )}
                </Card>
              </div>

              {/* Max performance chart */}
              {maxChartData.length >= 2 && (
                <Card>
                  <p className="text-xs font-semibold text-gray-500 mb-3">Historique des tests</p>
                  <ResponsiveContainer width="100%" height={130}>
                    <LineChart data={maxChartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                        formatter={(v: number) => [`${v} pompes`, '']}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
                      />
                      {maxPR > 0 && (
                        <ReferenceLine y={maxPR} stroke="#f59e0b" strokeDasharray="4 3"
                          label={{ value: `PR ${maxPR}`, position: 'insideTopRight', fontSize: 9, fill: '#f59e0b' }} />
                      )}
                      <Line type="monotone" dataKey="reps" stroke="#f59e0b" strokeWidth={2.5}
                        dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#f59e0b' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* History list */}
              <Card className="mt-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">Tous les tests</p>
                <div className="flex flex-col divide-y divide-gray-100">
                  {maxHistory.map((r, i) => (
                    <div key={r.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        {r.reps === maxPR && <Trophy size={13} className="text-amber-500 shrink-0" />}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {r.reps} pompes
                            {r.reps === maxPR && <span className="ml-1.5 text-xs text-amber-600 font-bold">PR</span>}
                          </p>
                          <p className="text-xs text-gray-400">{formatDateShort(r.date)}</p>
                        </div>
                      </div>
                      {i > 0 && (() => {
                        const prev = maxHistory[i - 1]
                        const diff = r.reps - prev.reps
                        return diff !== 0 ? (
                          <span className={`text-xs font-semibold ${diff > 0 ? 'text-emerald-600' : 'text-red-400'}`}>
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        ) : <span className="text-xs text-gray-400">=</span>
                      })()}
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </motion.div>

        {/* ── Programme chart ── */}
        {programChartData.length >= 2 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <p className="text-sm font-semibold text-gray-700 mb-3">Pompes par séance (programme)</p>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={programChartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f97316" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(v: number) => [`${v} pompes`, '']}
                  />
                  <Area type="monotone" dataKey="pompes" stroke="#f97316" strokeWidth={2}
                    fill="url(#grad)" dot={false} activeDot={{ r: 4, fill: '#f97316' }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        )}

        {/* ── Global stats ── */}
        <motion.div className="grid grid-cols-2 gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          {[
            { label: 'Total pompes',    value: stats.totalPushups.toLocaleString('fr') },
            { label: 'Séances totales', value: stats.totalSessions },
            { label: 'Meilleur streak', value: `${stats.bestStreak}j` },
            { label: 'Meilleure séance',value: stats.bestSession },
          ].map(({ label, value }) => (
            <Card key={label}>
              <p className="text-xs text-gray-500 mb-0.5">{label}</p>
              <p className="text-2xl font-black text-gray-900">{value}</p>
            </Card>
          ))}
        </motion.div>

      </div>
      <Navigation />
    </div>
  )
}
