'use client'
import { ChangeEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Camera, User, Settings, ChevronLeft, ChevronRight, Award, BarChart2, History,
  X, Dumbbell, Timer, Flame, BookOpen, Play, Zap,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useAppData } from '@/hooks/useWorkoutProgram'
import { getLevelLabel, getLevelBadgeClass, formatDate } from '@/lib/utils'
import { ALL_BADGES } from '@/lib/programGenerator'
import { ALL_PLANK_BADGES } from '@/lib/plank/badges'
import { computePlankTotals, computeBestContinuousHold, computePlankStreak } from '@/lib/plank/stats'
import { computeCombinedStreak } from '@/lib/combined'
import { formatPlankGoal } from '@/lib/plank/format'
import { ALL_JUMP_BADGES } from '@/lib/rope/badges'
import { computeJumpTotals, computeJumpStreak, computeBestSessionJumps } from '@/lib/rope/stats'
import { formatJumps, formatDurationHMS as formatJumpDurationHMS } from '@/lib/rope/format'

export default function ProfilePage() {
  const router = useRouter()
  const { data, hydrated, updateAvatarImage } = useAppData()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const size = 320
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const scale = Math.max(size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
        updateAvatarImage(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  if (!hydrated) return (
    <div className="app-page flex items-center justify-center" style={{ minHeight: '75dvh' }}>
      <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
  )

  const { profile, stats, earnedBadges, gainage, jumprope } = data
  const pompesBadges = ALL_BADGES.map(b => ({ ...b, earned: earnedBadges.includes(b.id) }))
  const gainageBadges = ALL_PLANK_BADGES.map(b => ({ ...b, earned: gainage.earnedBadges.includes(b.id) }))
  const gainageTotals = computePlankTotals(gainage.sessions)
  const gainageBestHold = computeBestContinuousHold(gainage.sessions, gainage.tests)
  const { currentStreak: gainageStreak } = computePlankStreak(gainage.sessions)
  const { currentStreak: combinedStreak } = computeCombinedStreak(data)
  const jumpBadges = ALL_JUMP_BADGES.map(b => ({ ...b, earned: jumprope.earnedBadges.includes(b.id) }))
  const jumpTotals = computeJumpTotals(jumprope.sessions)
  const jumpBestSession = computeBestSessionJumps(jumprope.sessions)
  const { currentStreak: jumpStreak } = computeJumpStreak(jumprope.sessions)

  return (
    <div className="app-content-page bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 shrink-0">
            <ChevronLeft size={20} className="text-gray-400" />
          </button>
          <div className="relative shrink-0">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-md overflow-hidden"
              style={{ backgroundColor: profile?.avatarColor ?? '#f97316' }}
            >
              {profile?.avatarImage ? (
                <img src={profile.avatarImage} alt="" className="w-full h-full object-cover" />
              ) : profile ? (
                profile.name[0].toUpperCase()
              ) : (
                <User size={24} />
              )}
            </div>
            {profile && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-md"
                  aria-label="Modifier la photo"
                >
                  <Camera size={12} />
                </button>
                {profile.avatarImage && (
                  <button
                    onClick={() => updateAvatarImage(null)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-500 text-white flex items-center justify-center shadow"
                    aria-label="Retirer la photo"
                  >
                    <X size={10} />
                  </button>
                )}
              </>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {profile ? (
              <>
                <h1 className="text-xl font-black text-gray-900 truncate">{profile.name}</h1>
                <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-0.5 ${getLevelBadgeClass(profile.level)}`}>
                  {getLevelLabel(profile.level)}
                </span>
              </>
            ) : (
              <>
                <h1 className="text-xl font-black text-gray-900">Ton profil</h1>
                <Link href="/onboarding" className="text-xs font-semibold text-brand-600">
                  Créer mon profil Pompes →
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
          {profile && <span>Membre depuis {formatDate(profile.createdAt)}</span>}
          {combinedStreak > 0 && (
            <span className="flex items-center gap-1 text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded-full">
              <Flame size={11} /> {combinedStreak} jour{combinedStreak > 1 ? 's' : ''} de suite
            </span>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
      </div>

      <div className="px-4 py-4 flex flex-col gap-5 page-scroll-gutter">

        {/* ── Pompes ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
              <Dumbbell size={14} className="text-white" />
            </div>
            <h2 className="font-black text-gray-900">Pompes</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Séances', value: stats.totalSessions },
              { label: 'Total', value: stats.totalPushups.toLocaleString('fr') },
              { label: 'Record', value: stats.bestSingleSet },
            ].map(({ label, value }) => (
              <Card key={label} className="text-center">
                <p className="text-xl font-black text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </Card>
            ))}
          </div>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Award size={16} className="text-amber-500" /> Badges
              </p>
              <span className="text-xs text-gray-400">{earnedBadges.length} / {ALL_BADGES.length}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {pompesBadges.map(b => (
                <motion.div
                  key={b.id}
                  whileTap={{ scale: 0.93 }}
                  className={`flex flex-col items-center p-2 rounded-xl text-center transition-opacity ${b.earned ? 'opacity-100' : 'opacity-30 grayscale'}`}
                  title={b.description}
                >
                  <span className="text-2xl">{b.icon}</span>
                  <p className="text-[9px] text-gray-600 mt-1 leading-tight">{b.name}</p>
                </motion.div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/history">
              <Card className="flex items-center gap-2.5 hover:bg-gray-50 transition-colors">
                <History size={16} className="text-gray-400 shrink-0" />
                <span className="flex-1 text-xs font-medium text-gray-800">Historique</span>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
              </Card>
            </Link>
            <Link href="/progress">
              <Card className="flex items-center gap-2.5 hover:bg-gray-50 transition-colors">
                <BarChart2 size={16} className="text-gray-400 shrink-0" />
                <span className="flex-1 text-xs font-medium text-gray-800">Progression</span>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
              </Card>
            </Link>
          </div>
        </section>

        {/* ── Gainage ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-700 flex items-center justify-center shrink-0">
              <Timer size={14} className="text-white" />
            </div>
            <h2 className="font-black text-gray-900">Gainage</h2>
          </div>

          {!gainage.onboarded ? (
            <Card className="text-center py-8 bg-teal-50 border-teal-200">
              <p className="text-3xl mb-2">🧘</p>
              <p className="text-sm font-semibold text-teal-800 mb-1">Pas encore commencé</p>
              <p className="text-xs text-teal-600 mb-4">Renforce ton tronc à ton rythme.</p>
              <Link href="/gainage/onboarding">
                <button className="inline-flex items-center gap-1.5 text-sm font-bold text-white bg-teal-700 px-4 py-2 rounded-xl">
                  <Play size={14} /> Commencer
                </button>
              </Link>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Séances', value: gainageTotals.totalSessions },
                  { label: 'Cumulé', value: formatPlankGoal(gainageTotals.totalHoldSeconds) },
                  { label: 'Record', value: formatPlankGoal(gainageBestHold) },
                ].map(({ label, value }) => (
                  <Card key={label} className="text-center">
                    <p className="text-xl font-black text-gray-900">{value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </Card>
                ))}
              </div>

              {gainageStreak > 0 && (
                <Card className="bg-teal-50 border-teal-100 flex items-center gap-2">
                  <Flame size={14} className="text-teal-600" />
                  <p className="text-xs font-semibold text-teal-800">{gainageStreak} jour{gainageStreak > 1 ? 's' : ''} de suite en gainage</p>
                </Card>
              )}

              <Card>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Award size={16} className="text-amber-500" /> Badges
                  </p>
                  <span className="text-xs text-gray-400">{gainage.earnedBadges.length} / {ALL_PLANK_BADGES.length}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {gainageBadges.map(b => (
                    <motion.div
                      key={b.id}
                      whileTap={{ scale: 0.93 }}
                      className={`flex flex-col items-center p-2 rounded-xl text-center transition-opacity ${b.earned ? 'opacity-100' : 'opacity-30 grayscale'}`}
                      title={b.description}
                    >
                      <span className="text-2xl">{b.icon}</span>
                      <p className="text-[9px] text-gray-600 mt-1 leading-tight">{b.name}</p>
                    </motion.div>
                  ))}
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Link href="/gainage/history">
                  <Card className="flex items-center gap-2.5 hover:bg-gray-50 transition-colors">
                    <History size={16} className="text-gray-400 shrink-0" />
                    <span className="flex-1 text-xs font-medium text-gray-800">Historique</span>
                    <ChevronRight size={14} className="text-gray-300 shrink-0" />
                  </Card>
                </Link>
                <Link href="/gainage/stats">
                  <Card className="flex items-center gap-2.5 hover:bg-gray-50 transition-colors">
                    <BarChart2 size={16} className="text-gray-400 shrink-0" />
                    <span className="flex-1 text-xs font-medium text-gray-800">Statistiques</span>
                    <ChevronRight size={14} className="text-gray-300 shrink-0" />
                  </Card>
                </Link>
              </div>
              <Link href="/gainage/guide">
                <Card className="flex items-center gap-2.5 hover:bg-gray-50 transition-colors">
                  <BookOpen size={16} className="text-gray-400 shrink-0" />
                  <span className="flex-1 text-xs font-medium text-gray-800">Bien réaliser la planche</span>
                  <ChevronRight size={14} className="text-gray-300 shrink-0" />
                </Card>
              </Link>
            </>
          )}
        </section>

        {/* ── Corde à sauter ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
              <Zap size={14} className="text-white" />
            </div>
            <h2 className="font-black text-gray-900">Corde à sauter</h2>
          </div>

          {!jumprope.onboarded ? (
            <Card className="text-center py-8 bg-violet-50 border-violet-200">
              <p className="text-3xl mb-2">🪢</p>
              <p className="text-sm font-semibold text-violet-800 mb-1">Pas encore commencé</p>
              <p className="text-xs text-violet-600 mb-4">Compte tes sauts par caméra, mouvement ou manuellement.</p>
              <Link href="/jumprope/onboarding">
                <button className="inline-flex items-center gap-1.5 text-sm font-bold text-white bg-violet-600 px-4 py-2 rounded-xl">
                  <Play size={14} /> Commencer
                </button>
              </Link>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Séances', value: jumpTotals.totalSessions },
                  { label: 'Total sauts', value: formatJumps(jumpTotals.totalJumps) },
                  { label: 'Record', value: formatJumps(jumpBestSession) },
                ].map(({ label, value }) => (
                  <Card key={label} className="text-center">
                    <p className="text-xl font-black text-gray-900">{value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </Card>
                ))}
              </div>

              {jumpTotals.totalActiveDurationSeconds > 0 && (
                <Card className="bg-gray-50 border-none flex items-center justify-between">
                  <span className="text-xs text-gray-500">Temps actif cumulé</span>
                  <span className="text-sm font-bold text-gray-900">{formatJumpDurationHMS(jumpTotals.totalActiveDurationSeconds)}</span>
                </Card>
              )}

              {jumpStreak > 0 && (
                <Card className="bg-violet-50 border-violet-100 flex items-center gap-2">
                  <Flame size={14} className="text-violet-600" />
                  <p className="text-xs font-semibold text-violet-800">{jumpStreak} jour{jumpStreak > 1 ? 's' : ''} de suite en corde à sauter</p>
                </Card>
              )}

              <Card>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Award size={16} className="text-amber-500" /> Badges
                  </p>
                  <span className="text-xs text-gray-400">{jumprope.earnedBadges.length} / {ALL_JUMP_BADGES.length}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {jumpBadges.filter(b => b.earned).slice(0, 8).map(b => (
                    <motion.div
                      key={b.id}
                      whileTap={{ scale: 0.93 }}
                      className="flex flex-col items-center p-2 rounded-xl text-center"
                      title={b.description}
                    >
                      <span className="text-2xl">{b.icon}</span>
                      <p className="text-[9px] text-gray-600 mt-1 leading-tight">{b.name}</p>
                    </motion.div>
                  ))}
                  {jumpBadges.filter(b => b.earned).length === 0 && (
                    <p className="col-span-4 text-xs text-gray-400 text-center py-2">Aucun badge débloqué pour l&apos;instant.</p>
                  )}
                </div>
                <Link href="/jumprope/badges" className="block mt-2 text-xs font-semibold text-violet-600 text-center">
                  Voir tous les badges →
                </Link>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Link href="/jumprope/history">
                  <Card className="flex items-center gap-2.5 hover:bg-gray-50 transition-colors">
                    <History size={16} className="text-gray-400 shrink-0" />
                    <span className="flex-1 text-xs font-medium text-gray-800">Historique</span>
                    <ChevronRight size={14} className="text-gray-300 shrink-0" />
                  </Card>
                </Link>
                <Link href="/jumprope/stats">
                  <Card className="flex items-center gap-2.5 hover:bg-gray-50 transition-colors">
                    <BarChart2 size={16} className="text-gray-400 shrink-0" />
                    <span className="flex-1 text-xs font-medium text-gray-800">Statistiques</span>
                    <ChevronRight size={14} className="text-gray-300 shrink-0" />
                  </Card>
                </Link>
              </div>
            </>
          )}
        </section>

        {/* ── Réglages ── */}
        <section className="flex flex-col gap-2">
          <Link href="/account">
            <Card className="flex items-center gap-3 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <Settings size={16} className="text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">Compte &amp; données</p>
                <p className="text-xs text-gray-500 mt-0.5">Rappels, synchronisation cloud, export</p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </Card>
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/settings">
              <Card className="flex items-center gap-2.5 hover:bg-gray-50 transition-colors">
                <span className="flex-1 text-xs font-medium text-gray-800">Réglages Pompes</span>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
              </Card>
            </Link>
            <Link href="/gainage/settings">
              <Card className="flex items-center gap-2.5 hover:bg-gray-50 transition-colors">
                <span className="flex-1 text-xs font-medium text-gray-800">Réglages Gainage</span>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
              </Card>
            </Link>
          </div>
          <Link href="/jumprope/settings">
            <Card className="flex items-center gap-2.5 hover:bg-gray-50 transition-colors">
              <span className="flex-1 text-xs font-medium text-gray-800">Réglages Corde à sauter</span>
              <ChevronRight size={14} className="text-gray-300 shrink-0" />
            </Card>
          </Link>
        </section>
      </div>
    </div>
  )
}
