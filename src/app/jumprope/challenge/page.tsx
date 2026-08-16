'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, CalendarCheck, CheckCircle2, Circle, Play, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useJumpRopeData } from '@/hooks/rope/useJumpRopeData'
import { getChallenge7State, isChallenge7Complete } from '@/lib/rope/challenge'
import { computeDailyChallengeProgress } from '@/lib/rope/stats'
import { JUMP_GOAL_PRESETS } from '@/lib/rope/config'
import { formatJumps } from '@/lib/rope/format'

export default function JumpRopeChallengePage() {
  const router = useRouter()
  const { hydrated, jumprope, startChallenge7, updateDailyChallenge } = useJumpRopeData()
  const [dailyTarget, setDailyTarget] = useState<number | null>(jumprope.dailyChallenge.targetJumps)

  if (!hydrated) return null

  const state = getChallenge7State(jumprope.sessions)
  const complete = jumprope.challenge7.status === 'completed' || isChallenge7Complete(jumprope.sessions)
  const nextDay = state.find(d => !d.completed)
  const dailyProgress = computeDailyChallengeProgress(jumprope.sessions)

  const startDay = (day: number, targetJumps: number) => {
    router.push(`/jumprope/session?mode=challenge7&day=${day}&targetJumps=${targetJumps}`)
  }

  const startDaily = () => {
    if (!jumprope.dailyChallenge.targetJumps) return
    router.push(`/jumprope/session?mode=daily_challenge&targetJumps=${jumprope.dailyChallenge.targetJumps}`)
  }

  return (
    <div className="app-content-page bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <h1 className="font-black text-xl text-gray-900">Défis</h1>
      </div>

      <div className="flex-1 px-4 pb-8 page-scroll-gutter flex flex-col gap-6">
        {/* ── Défi 7 jours ── */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-1.5"><CalendarCheck size={16} className="text-violet-600" /> Défi 7 jours</h2>

          {jumprope.challenge7.status === 'not_started' ? (
            <Card className="bg-violet-50 border-violet-200 flex flex-col gap-2">
              <p className="text-sm text-violet-800">7 jours, un objectif de sauts progressif chaque jour (250 à 500 sauts). Tu peux le commencer quand tu veux.</p>
              <Button onClick={startChallenge7}>Démarrer le défi</Button>
            </Card>
          ) : complete ? (
            <Card className="bg-amber-50 border-amber-200 flex flex-col items-center text-center gap-1 py-5">
              <Sparkles size={24} className="text-amber-500" />
              <p className="font-bold text-amber-900">Défi terminé, bravo !</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {state.map(d => (
                <div key={d.day} className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 ${d.completed ? 'border-emerald-200 bg-emerald-50' : nextDay?.day === d.day ? 'border-violet-600 bg-violet-50' : 'border-gray-100 bg-white'}`}>
                  {d.completed ? <CheckCircle2 size={20} className="text-emerald-600 shrink-0" /> : <Circle size={20} className="text-gray-300 shrink-0" />}
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">Jour {d.day}</p>
                    <p className="text-xs text-gray-500">{formatJumps(d.achievedJumps)} / {formatJumps(d.targetJumps)} sauts</p>
                  </div>
                  {!d.completed && nextDay?.day === d.day && (
                    <button onClick={() => startDay(d.day, d.targetJumps)} className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
                      <Play size={16} className="text-white ml-0.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Défi quotidien ── */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-2.5">Défi quotidien</h2>
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">Activer</p>
              <button
                onClick={() => updateDailyChallenge({ enabled: !jumprope.dailyChallenge.enabled })}
                className={`w-12 h-7 rounded-full transition-colors relative ${jumprope.dailyChallenge.enabled ? 'bg-violet-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform ${jumprope.dailyChallenge.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {jumprope.dailyChallenge.enabled && (
              <>
                <div className="flex flex-wrap gap-2">
                  {JUMP_GOAL_PRESETS.slice(0, 5).map(g => (
                    <button key={g} onClick={() => { setDailyTarget(g); updateDailyChallenge({ targetJumps: g }) }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border-2 ${dailyTarget === g ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-200 bg-white text-gray-600'}`}>
                      {formatJumps(g)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Aujourd&apos;hui</span>
                  <span className="font-bold text-gray-900">{formatJumps(dailyProgress.today)} {jumprope.dailyChallenge.targetJumps ? `/ ${formatJumps(jumprope.dailyChallenge.targetJumps)}` : ''}</span>
                </div>
                <Button fullWidth onClick={startDaily} disabled={!jumprope.dailyChallenge.targetJumps}>Faire la séance du jour</Button>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
