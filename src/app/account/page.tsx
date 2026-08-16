'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Cloud, CloudOff, Bell, Download, Printer, LogOut, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useCloudSync } from '@/hooks/useCloudSync'
import {
  DEFAULT_APP_DATA, STORAGE_KEY, STORAGE_BACKUP_KEY, LEGACY_STORAGE_KEYS,
  migrateAppData, prepareAppDataForSave,
} from '@/lib/storage'
import { AppData, ActivityType } from '@/types'
import { downloadExportCsv } from '@/lib/exportData'
import { computeCombinedStreak, computeCombinedWeekSummary } from '@/lib/combined'
import { formatDate } from '@/lib/utils'

const DAYS = [
  { value: 1, label: 'L' }, { value: 2, label: 'M' }, { value: 3, label: 'M' }, { value: 4, label: 'J' },
  { value: 5, label: 'V' }, { value: 6, label: 'S' }, { value: 0, label: 'D' },
]

export default function AccountPage() {
  const router = useRouter()
  const [data, setData, hydrated] = useLocalStorage<AppData>(STORAGE_KEY, DEFAULT_APP_DATA, {
    backupKey: STORAGE_BACKUP_KEY,
    fallbackKeys: LEGACY_STORAGE_KEYS,
    migrate: migrateAppData,
    prepareForSave: prepareAppDataForSave,
  })
  const sync = useCloudSync({ data, hydrated })

  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  if (!hydrated) return (
    <div className="app-content-page flex items-center justify-center" style={{ minHeight: '75dvh' }}>
      <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
  )

  const { reminders } = data
  const updateReminders = (patch: Partial<AppData['reminders']>) => {
    setData(prev => ({ ...prev, reminders: { ...prev.reminders, ...patch } }))
  }
  const toggleDay = (day: number) => {
    const days = reminders.days.includes(day) ? reminders.days.filter(d => d !== day) : [...reminders.days, day]
    updateReminders({ days })
  }
  const toggleActivity = (activity: ActivityType) => {
    const has = reminders.activities.includes(activity)
    const activities = has ? reminders.activities.filter(a => a !== activity) : [...reminders.activities, activity]
    updateReminders({ activities })
  }
  const toggleRemindersEnabled = async () => {
    if (!reminders.enabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
    updateReminders({ enabled: !reminders.enabled })
  }

  const handleSendMagicLink = async () => {
    setAuthError(null)
    const { error } = await sync.signInWithEmail(email)
    if (error) setAuthError(error)
    else setEmailSent(true)
  }

  const combinedStreak = computeCombinedStreak(data)
  const weekSummary = computeCombinedWeekSummary(data)

  return (
    <div className="app-content-page bg-gray-50 flex flex-col">
      <div className="no-print flex items-center gap-3 px-4 pt-6 pb-4 bg-white border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <h1 className="font-black text-xl text-gray-900">Compte &amp; données</h1>
      </div>

      <div className="no-print px-4 py-4 flex flex-col gap-5 page-scroll-gutter">

        {/* ── Synchronisation cloud ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Synchronisation cloud</p>
          {!sync.isConfigured ? (
            <Card className="flex items-start gap-3 bg-gray-100 border-none">
              <CloudOff size={18} className="text-gray-400 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500">
                Non configurée sur ce déploiement. Tes données restent uniquement sur cet appareil (localStorage).
              </p>
            </Card>
          ) : sync.session ? (
            <Card className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Cloud size={18} className="text-emerald-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{sync.session.user.email}</p>
                  <p className="text-xs text-gray-400">
                    {sync.status === 'syncing' ? 'Synchronisation…' : sync.lastSyncedAt ? `Synchronisé à ${new Date(sync.lastSyncedAt).toLocaleTimeString('fr-FR')}` : 'Pas encore synchronisé'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => sync.pushNow()}>Synchroniser maintenant</Button>
                <Button size="sm" variant="ghost" onClick={() => sync.signOut()}><LogOut size={14} /> Déconnexion</Button>
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col gap-3">
              <p className="text-xs text-gray-500">Connecte-toi pour sauvegarder tes données et les retrouver sur un autre appareil.</p>
              {emailSent ? (
                <p className="text-sm text-emerald-600 font-medium flex items-center gap-2"><CheckCircle2 size={16} /> Lien envoyé à {email}, vérifie ta boîte mail.</p>
              ) : (
                <>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    className="h-11 rounded-xl border-2 border-gray-200 px-3 text-sm focus:outline-none focus:border-brand-400"
                  />
                  {authError && <p className="text-xs text-red-500">{authError}</p>}
                  <Button size="sm" onClick={handleSendMagicLink} disabled={!email.includes('@')}>Recevoir un lien de connexion</Button>
                </>
              )}
            </Card>
          )}

          {sync.cloudAvailable && (
            <Card className="mt-2 border-amber-300 bg-amber-50">
              <p className="text-sm font-semibold text-amber-900">Des données cloud plus récentes existent</p>
              <p className="text-xs text-amber-700 mt-1 mb-3">Veux-tu les charger sur cet appareil ? Tes données locales actuelles seront remplacées.</p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => sync.dismissCloudData()}>Ignorer</Button>
                <Button size="sm" className="flex-1" onClick={() => sync.acceptCloudData(setData)}>Charger depuis le cloud</Button>
              </div>
            </Card>
          )}
        </div>

        {/* ── Rappels ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Rappels</p>
          <Card className="flex flex-col gap-3">
            <button onClick={toggleRemindersEnabled} className="flex items-center gap-3">
              <Bell size={18} className={reminders.enabled ? 'text-brand-500' : 'text-gray-300'} />
              <span className="flex-1 text-left text-sm font-medium text-gray-800">Activer les rappels</span>
              <div className={`w-11 h-6 rounded-full transition-colors relative ${reminders.enabled ? 'bg-brand-500' : 'bg-gray-200'}`}>
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${reminders.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </button>

            {reminders.enabled && (
              <>
                <div className="flex gap-1.5">
                  {DAYS.map(d => (
                    <button key={d.value} onClick={() => toggleDay(d.value)}
                      className={`w-9 h-9 rounded-full text-xs font-bold ${reminders.days.includes(d.value) ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" min={0} max={23} value={reminders.hour}
                    onChange={e => updateReminders({ hour: Math.min(23, Math.max(0, Number(e.target.value) || 0)) })}
                    className="w-16 h-10 rounded-lg border-2 border-gray-200 px-2 text-sm font-semibold text-center" />
                  <span className="text-gray-400">h</span>
                  <input type="number" min={0} max={59} value={reminders.minute}
                    onChange={e => updateReminders({ minute: Math.min(59, Math.max(0, Number(e.target.value) || 0)) })}
                    className="w-16 h-10 rounded-lg border-2 border-gray-200 px-2 text-sm font-semibold text-center" />
                </div>
                <div className="flex gap-2">
                  {(['pompes', 'gainage'] as ActivityType[]).map(a => (
                    <button key={a} onClick={() => toggleActivity(a)}
                      className={`flex-1 h-10 rounded-xl text-sm font-semibold border-2 capitalize ${reminders.activities.includes(a) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-400'}`}>
                      {a}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  Rappel affiché sur l&apos;accueil si l&apos;app est ouverte le jour et après l&apos;heure choisis, tant que l&apos;une des activités sélectionnées n&apos;a pas été faite.
                </p>
              </>
            )}
          </Card>
        </div>

        {/* ── Export ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Export des données</p>
          <Card className="flex flex-col gap-2">
            <Button size="sm" variant="secondary" onClick={() => downloadExportCsv(data)}>
              <Download size={14} /> Exporter en CSV (historique complet)
            </Button>
            <Button size="sm" variant="secondary" onClick={() => window.print()}>
              <Printer size={14} /> Exporter en PDF (bilan résumé)
            </Button>
          </Card>
        </div>
      </div>

      {/* Bilan imprimable — visible uniquement à l'impression (Exporter en PDF) */}
      <div className="print-only px-6 py-8">
        <h1 className="text-2xl font-black mb-1">100 Pompes — Bilan</h1>
        <p className="text-sm text-gray-500 mb-6">Généré le {formatDate(new Date().toISOString())}</p>

        <h2 className="text-lg font-bold mb-2">Vue d&apos;ensemble</h2>
        <table className="w-full text-sm mb-6">
          <tbody>
            <tr><td className="py-1 pr-4 text-gray-500">Série active (toutes activités)</td><td className="font-semibold">{combinedStreak.currentStreak} jour(s)</td></tr>
            <tr><td className="py-1 pr-4 text-gray-500">Meilleure série</td><td className="font-semibold">{combinedStreak.bestStreak} jour(s)</td></tr>
            <tr><td className="py-1 pr-4 text-gray-500">Jours actifs cette semaine</td><td className="font-semibold">{weekSummary.activeDaysThisWeek}</td></tr>
          </tbody>
        </table>

        <h2 className="text-lg font-bold mb-2">Pompes</h2>
        <table className="w-full text-sm mb-6">
          <tbody>
            <tr><td className="py-1 pr-4 text-gray-500">Total pompes</td><td className="font-semibold">{data.stats.totalPushups}</td></tr>
            <tr><td className="py-1 pr-4 text-gray-500">Séances terminées</td><td className="font-semibold">{data.stats.totalSessions}</td></tr>
            <tr><td className="py-1 pr-4 text-gray-500">Meilleure série (reps)</td><td className="font-semibold">{data.stats.bestSingleSet}</td></tr>
          </tbody>
        </table>

        <h2 className="text-lg font-bold mb-2">Gainage</h2>
        <table className="w-full text-sm">
          <tbody>
            <tr><td className="py-1 pr-4 text-gray-500">Tests effectués</td><td className="font-semibold">{data.gainage.tests.length}</td></tr>
            <tr><td className="py-1 pr-4 text-gray-500">Séances enregistrées</td><td className="font-semibold">{data.gainage.sessions.length}</td></tr>
            <tr><td className="py-1 pr-4 text-gray-500">Badges débloqués</td><td className="font-semibold">{data.gainage.earnedBadges.length}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
