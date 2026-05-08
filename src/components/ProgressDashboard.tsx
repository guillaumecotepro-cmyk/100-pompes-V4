'use client'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Progress } from './ui/Progress'
import { AppData } from '@/types'
import { getLevelLabel, getLevelBadgeClass, formatDateShort, formatDuration } from '@/lib/utils'
import { getProgressPercent } from '@/lib/programGenerator'

interface ProgressDashboardProps {
  data: AppData
}

export function ProgressDashboard({ data }: ProgressDashboardProps) {
  const { stats, profile, program, history } = data

  const chartData = useMemo(() => {
    const last14 = history.slice(0, 14).reverse()
    return last14.map(h => ({
      date: formatDateShort(h.date),
      pompes: h.totalReps,
    }))
  }, [history])

  const progressPct = program ? getProgressPercent(program) : 0
  const weeksLeft   = program
    ? Math.ceil((program.sessions.length - program.currentSessionIndex) / 3)
    : 0

  const levelClass = profile ? getLevelBadgeClass(profile.level) : ''

  return (
    <div className="flex flex-col gap-4">
      {/* Level + streak row */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-gray-500 mb-1">Niveau</p>
          <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${levelClass}`}>
            {profile ? getLevelLabel(profile.level) : '—'}
          </span>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 mb-1">Streak</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-gray-900">{stats.currentStreak}</span>
            <span className="text-xs text-gray-500">jours</span>
          </div>
          {stats.currentStreak > 0 && <p className="text-xs text-brand-500 mt-0.5">🔥 En cours</p>}
        </Card>
      </div>

      {/* Goal card */}
      <Card elevated>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500">Objectif programme</p>
            <p className="font-bold text-gray-900">100 Pompes d'affilée</p>
          </div>
          <span className="text-2xl font-black text-brand-500">{progressPct}%</span>
        </div>
        <Progress value={progressPct} height="lg" animated />
        {weeksLeft > 0 && (
          <p className="text-xs text-gray-400 mt-2">≈ {weeksLeft} semaine{weeksLeft > 1 ? 's' : ''} restante{weeksLeft > 1 ? 's' : ''}</p>
        )}
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total pompes',  value: stats.totalPushups.toLocaleString('fr'), suffix: '' },
          { label: 'Séances',       value: stats.totalSessions,    suffix: '' },
          { label: 'Meilleure série', value: stats.bestSingleSet,  suffix: '' },
          { label: 'Meilleure séance', value: stats.bestSession,   suffix: '' },
        ].map(({ label, value, suffix }) => (
          <Card key={label}>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-black text-gray-900">{value}<span className="text-sm font-normal text-gray-400 ml-1">{suffix}</span></p>
          </Card>
        ))}
      </div>

      {/* Chart */}
      {chartData.length >= 2 && (
        <Card>
          <p className="text-sm font-semibold text-gray-700 mb-3">Pompes par séance</p>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
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
      )}
    </div>
  )
}
