'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useJumpRopeData } from '@/hooks/rope/useJumpRopeData'

export default function JumpRopeManualEntryPage() {
  const router = useRouter()
  const { recordSession } = useJumpRopeData()

  const [jumps, setJumps] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    const jumpCount = Number(jumps)
    const durationSeconds = (Number(minutes) || 0) * 60 + (Number(seconds) || 0)
    if (!Number.isFinite(jumpCount) || jumpCount <= 0) { setError('Indique un nombre de sauts valide.'); return }
    if (durationSeconds <= 0) { setError('Indique une durée valide.'); return }

    const avgCadence = Math.round((jumpCount / durationSeconds) * 60)
    recordSession({
      mode: 'free',
      startedAt: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      totalDurationSeconds: durationSeconds,
      activeDurationSeconds: durationSeconds,
      totalJumps: jumpCount,
      avgCadence,
      maxCadence: avgCadence,
      countingMethod: 'manual',
      countingAlgorithmVersion: 1,
      series: [{ order: 0, jumps: jumpCount, durationSeconds, activeDurationSeconds: durationSeconds, avgCadence, maxCadence: avgCadence, bestStreak: jumpCount, status: 'completed' }],
      bestStreak: jumpCount,
      status: 'completed',
      notes: notes.trim() || null,
    })
    router.push('/jumprope/history')
  }

  return (
    <div className="app-content-page bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <h1 className="text-lg font-black text-gray-900 flex items-center gap-2"><PenLine size={18} className="text-violet-600" /> Saisie manuelle</h1>
      </div>

      <div className="flex-1 px-5 pt-2 flex flex-col gap-4 page-scroll-gutter">
        <p className="text-sm text-gray-500">Enregistre une séance déjà réalisée, sans passer par le compteur en direct.</p>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-gray-500">Nombre de sauts</span>
          <input type="number" inputMode="numeric" value={jumps} onChange={e => setJumps(e.target.value)}
            placeholder="Ex. 300" className="h-14 rounded-xl border-2 border-gray-200 px-4 text-xl font-bold" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-gray-500">Durée</span>
          <div className="flex items-center gap-2">
            <input type="number" inputMode="numeric" min={0} value={minutes} onChange={e => setMinutes(e.target.value)}
              placeholder="min" className="w-24 h-12 rounded-xl border-2 border-gray-200 px-3 text-base font-semibold text-center" />
            <span className="text-gray-400 font-semibold">min</span>
            <input type="number" inputMode="numeric" min={0} max={59} value={seconds} onChange={e => setSeconds(e.target.value)}
              placeholder="sec" className="w-24 h-12 rounded-xl border-2 border-gray-200 px-3 text-base font-semibold text-center" />
            <span className="text-gray-400 font-semibold">s</span>
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-gray-500">Note (facultatif)</span>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="rounded-xl border-2 border-gray-200 px-3 py-2 text-sm resize-none" />
        </label>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <Card className="bg-gray-50">
          <p className="text-xs text-gray-500">
            Cette séance sera marquée &laquo; saisie manuelle &raquo; dans ton historique — utile pour garder une trace,
            sans jamais fausser tes statistiques de comptage automatique.
          </p>
        </Card>

        <div className="mt-auto pt-4">
          <Button size="xl" fullWidth onClick={submit}>Enregistrer la séance</Button>
        </div>
      </div>
    </div>
  )
}
