'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, Calendar, CheckCircle, XCircle, MinusCircle, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Navigation } from '@/components/Navigation'
import { usePlankData } from '@/hooks/plank/usePlankData'
import { formatDate } from '@/lib/utils'
import { formatPlankGoal } from '@/lib/plank/format'

type Filter = 'all' | 'program' | 'free' | 'test'

const STATUS_ICON = {
  completed: <CheckCircle size={16} className="text-emerald-500 shrink-0" />,
  interrupted: <MinusCircle size={16} className="text-orange-400 shrink-0" />,
  cancelled: <XCircle size={16} className="text-gray-400 shrink-0" />,
}

const STATUS_LABEL: Record<string, string> = {
  completed: 'Terminée',
  interrupted: 'Interrompue',
  cancelled: 'Annulée',
}

export default function GainageHistoryPage() {
  const router = useRouter()
  const { hydrated, gainage, deleteSession } = usePlankData()
  const [filter, setFilter] = useState<Filter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const items = useMemo(() => {
    const sessionItems = gainage.sessions
      .filter(s => filter === 'all' || filter === s.mode)
      .map(s => ({ kind: 'session' as const, id: s.id, date: s.date, session: s }))
    const testItems = (filter === 'all' || filter === 'test')
      ? gainage.tests.map(t => ({ kind: 'test' as const, id: t.id, date: t.date, test: t }))
      : []
    return [...sessionItems, ...testItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [gainage.sessions, gainage.tests, filter])

  if (!hydrated) return null

  return (
    <div className="app-page bg-gray-50">
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Calendar size={20} className="text-teal-600" /> Historique
        </h1>
      </div>

      <div className="px-4 pt-4 flex gap-2 overflow-x-auto">
        {([['all', 'Tout'], ['program', 'Programme'], ['free', 'Libre'], ['test', 'Tests']] as [Filter, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border-2 shrink-0 ${filter === key ? 'border-teal-600 bg-teal-600 text-white' : 'border-gray-200 text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {items.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-4xl mb-3">🧘</p>
            <p className="text-gray-500">Aucune séance pour l&apos;instant.</p>
          </Card>
        ) : (
          items.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
              <Card>
                {item.kind === 'test' ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Test initial</p>
                      <p className="text-xs text-gray-400">{formatDate(item.date)}</p>
                    </div>
                    <p className="font-bold text-gray-900">{formatPlankGoal(item.test.durationSeconds)}</p>
                  </div>
                ) : (
                  <>
                    <button className="w-full text-left" onClick={() => setExpandedId(id => (id === item.id ? null : item.id))}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {STATUS_ICON[item.session.status]}
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {item.session.mode === 'program' ? 'Programme' : 'Libre'}
                            </p>
                            <p className="text-xs text-gray-400">{formatDate(item.date)} · {STATUS_LABEL[item.session.status]}</p>
                          </div>
                        </div>
                        <p className="font-bold text-gray-900">{formatPlankGoal(item.session.totalHoldSeconds)}</p>
                      </div>
                    </button>
                    {expandedId === item.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex gap-1.5 flex-wrap mb-3">
                          {item.session.sets.map((s, si) => (
                            <div key={si} className={`text-xs font-bold rounded-lg px-2 py-1 ${
                              s.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {formatPlankGoal(s.actualSeconds)}
                            </div>
                          ))}
                        </div>
                        {confirmDeleteId === item.id ? (
                          <div className="flex gap-2">
                            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 h-9 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600">Annuler</button>
                            <button onClick={() => { deleteSession(item.id); setConfirmDeleteId(null) }} className="flex-1 h-9 rounded-xl bg-red-500 text-white text-xs font-semibold">Confirmer la suppression</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(item.id)} className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
                            <Trash2 size={13} /> Supprimer cette séance
                          </button>
                        )}
                      </motion.div>
                    )}
                  </>
                )}
              </Card>
            </motion.div>
          ))
        )}
      </div>
      <Navigation space="gainage" />
    </div>
  )
}
