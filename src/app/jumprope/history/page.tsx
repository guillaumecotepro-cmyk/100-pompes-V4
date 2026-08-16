'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, Calendar, CheckCircle, XCircle, MinusCircle, Trash2, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Navigation } from '@/components/Navigation'
import { useJumpRopeData } from '@/hooks/rope/useJumpRopeData'
import { formatDate } from '@/lib/utils'
import { formatDurationHMS, formatJumps, formatCadence, COUNTING_METHOD_LABELS } from '@/lib/rope/format'
import { JumpSessionMode } from '@/types/rope'

type Filter = 'all' | 'program' | 'challenge' | 'other'

const STATUS_ICON = {
  completed: <CheckCircle size={16} className="text-emerald-500 shrink-0" />,
  interrupted: <MinusCircle size={16} className="text-orange-400 shrink-0" />,
  cancelled: <XCircle size={16} className="text-gray-400 shrink-0" />,
}

const STATUS_LABEL: Record<string, string> = { completed: 'Terminée', interrupted: 'Interrompue', cancelled: 'Annulée' }

const MODE_LABEL: Record<JumpSessionMode, string> = {
  free: 'Séance libre',
  goal_jumps: 'Objectif de sauts',
  goal_duration: 'Objectif de durée',
  intervals: 'Intervalles',
  daily_challenge: 'Défi quotidien',
  program: 'Programme',
  challenge7: 'Défi 7 jours',
}

function matchesFilter(mode: JumpSessionMode, filter: Filter): boolean {
  if (filter === 'all') return true
  if (filter === 'program') return mode === 'program'
  if (filter === 'challenge') return mode === 'challenge7' || mode === 'daily_challenge'
  return mode === 'free' || mode === 'goal_jumps' || mode === 'goal_duration' || mode === 'intervals'
}

export default function JumpRopeHistoryPage() {
  const router = useRouter()
  const { hydrated, jumprope, deleteSession, correctSessionJumps } = useJumpRopeData()
  const [filter, setFilter] = useState<Filter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const sessions = useMemo(
    () => jumprope.sessions.filter(s => matchesFilter(s.mode, filter)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [jumprope.sessions, filter]
  )

  if (!hydrated) return null

  const applyCorrection = (id: string) => {
    const n = Number(editValue)
    if (Number.isFinite(n) && n >= 0) correctSessionJumps(id, Math.round(n), 'Correction manuelle depuis l\'historique')
    setEditingId(null)
  }

  return (
    <div className="app-page bg-gray-50">
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Calendar size={20} className="text-violet-600" /> Historique
        </h1>
      </div>

      <div className="px-4 pt-4 flex gap-2 overflow-x-auto">
        {([['all', 'Tout'], ['program', 'Programme'], ['challenge', 'Défis'], ['other', 'Libre / objectifs']] as [Filter, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border-2 shrink-0 ${filter === key ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-200 text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {sessions.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-4xl mb-3">🪢</p>
            <p className="text-gray-500">Aucune séance pour l&apos;instant.</p>
          </Card>
        ) : (
          sessions.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
              <Card>
                <button className="w-full text-left" onClick={() => setExpandedId(id => (id === s.id ? null : s.id))}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {STATUS_ICON[s.status]}
                      <div>
                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                          {MODE_LABEL[s.mode]}
                          {s.manualCorrection && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">corrigée</span>}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(s.date)} · {STATUS_LABEL[s.status]}</p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-900">{formatJumps(s.totalJumps)}<span className="text-xs text-gray-400 font-normal"> sauts</span></p>
                  </div>
                </button>

                {expandedId === s.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <p>Durée active : <strong className="text-gray-900">{formatDurationHMS(s.activeDurationSeconds)}</strong></p>
                      <p>Cadence : <strong className="text-gray-900">{formatCadence(s.avgCadence)}</strong></p>
                      <p>Calories (est.) : <strong className="text-gray-900">{s.caloriesEstimated} kcal</strong></p>
                      <p>Méthode : <strong className="text-gray-900">{COUNTING_METHOD_LABELS[s.countingMethod]}</strong></p>
                    </div>

                    {s.series.length > 1 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {s.series.map((series, si) => (
                          <div key={si} className="text-xs font-bold rounded-lg px-2 py-1 bg-violet-50 text-violet-700">
                            {formatJumps(series.jumps)} sauts
                          </div>
                        ))}
                      </div>
                    )}

                    {editingId === s.id ? (
                      <div className="flex items-center gap-2">
                        <input type="number" inputMode="numeric" value={editValue} onChange={e => setEditValue(e.target.value)}
                          className="w-24 h-9 rounded-xl border border-gray-200 px-2 text-sm font-semibold text-center" />
                        <button onClick={() => applyCorrection(s.id)} className="h-9 px-3 rounded-xl bg-violet-600 text-white text-xs font-bold">Valider</button>
                        <button onClick={() => setEditingId(null)} className="h-9 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600">Annuler</button>
                      </div>
                    ) : confirmDeleteId === s.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmDeleteId(null)} className="flex-1 h-9 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600">Annuler</button>
                        <button onClick={() => { deleteSession(s.id); setConfirmDeleteId(null) }} className="flex-1 h-9 rounded-xl bg-red-500 text-white text-xs font-semibold">Confirmer la suppression</button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button onClick={() => { setEditingId(s.id); setEditValue(String(s.totalJumps)) }} className="flex items-center gap-1.5 text-xs font-semibold text-violet-600">
                          <Pencil size={13} /> Corriger le nombre de sauts
                        </button>
                        <button onClick={() => setConfirmDeleteId(s.id)} className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
                          <Trash2 size={13} /> Supprimer
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </Card>
            </motion.div>
          ))
        )}
      </div>
      <Navigation space="jumprope" />
    </div>
  )
}
