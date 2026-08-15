'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Navigation } from '@/components/Navigation'
import { useAppData } from '@/hooks/useWorkoutProgram'
import { formatDate, formatDuration } from '@/lib/utils'

export default function HistoryPage() {
  const router  = useRouter()
  const { data } = useAppData()
  const { history } = data

  const grouped = history.reduce<Record<string, typeof history>>((acc, h) => {
    const week = `Semaine ${h.week}`
    if (!acc[week]) acc[week] = []
    acc[week].push(h)
    return acc
  }, {})

  return (
    <div className="app-page bg-gray-50">
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Calendar size={20} className="text-brand-500" /> Historique
        </h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {history.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500">Aucune séance pour l&apos;instant.</p>
            <p className="text-sm text-gray-400 mt-1">Lance ta première séance !</p>
          </Card>
        ) : (
          Object.entries(grouped).map(([week, sessions], i) => (
            <motion.div key={week} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{week}</p>
              <Card>
                <div className="flex flex-col divide-y divide-gray-100">
                  {sessions.map(h => (
                    <div key={h.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {h.completed
                            ? <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                            : <XCircle size={16} className="text-orange-400 shrink-0" />
                          }
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Jour {h.day}</p>
                            <p className="text-xs text-gray-400">{formatDate(h.date)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{h.totalReps} <span className="text-xs text-gray-400 font-normal">/ {h.targetReps}</span></p>
                          <p className="text-xs text-gray-400">{formatDuration(h.duration)}</p>
                        </div>
                      </div>
                      {/* Sets mini detail */}
                      <div className="flex gap-1 mt-2">
                        {h.sets.map((s, si) => (
                          <div key={si} className="flex-1 text-center">
                            <div className={`text-xs font-bold rounded-lg py-0.5 ${
                              s.completedReps >= s.targetReps ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {s.completedReps}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
      <Navigation />
    </div>
  )
}
