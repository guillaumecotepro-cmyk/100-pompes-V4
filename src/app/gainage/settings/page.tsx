'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Volume2, VolumeX, Vibrate, Bell, BookOpen, ChevronRight, Info } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Navigation } from '@/components/Navigation'
import { usePlankData } from '@/hooks/plank/usePlankData'

const DAYS = [
  { value: 1, label: 'L' }, { value: 2, label: 'M' }, { value: 3, label: 'M' }, { value: 4, label: 'J' },
  { value: 5, label: 'V' }, { value: 6, label: 'S' }, { value: 0, label: 'D' },
]

export default function GainageSettingsPage() {
  const router = useRouter()
  const { hydrated, gainage, updateSettings } = usePlankData()

  if (!hydrated) return null
  const { settings } = gainage

  const toggle = (key: 'voiceEnabled' | 'beepEnabled' | 'gongEnabled' | 'vibrationEnabled') => {
    updateSettings({ [key]: !settings[key] })
  }

  const toggleDay = (day: number) => {
    const days = settings.reminders.days.includes(day)
      ? settings.reminders.days.filter(d => d !== day)
      : [...settings.reminders.days, day]
    updateSettings({ reminders: { ...settings.reminders, days } })
  }

  const toggleReminders = async () => {
    if (!settings.reminders.enabled) {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission()
      }
      updateSettings({ reminders: { ...settings.reminders, enabled: true } })
    } else {
      updateSettings({ reminders: { ...settings.reminders, enabled: false } })
    }
  }

  return (
    <div className="app-page bg-gray-50">
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <h1 className="text-xl font-black text-gray-900">Réglages Gainage</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-5">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Audio et vibrations</p>
          <Card className="flex flex-col divide-y divide-gray-100">
            {([
              ['voiceEnabled', 'Voix (annonces, décompte)'],
              ['beepEnabled', 'Bips (toutes les 10 s)'],
              ['gongEnabled', 'Gong (fin de série)'],
              ['vibrationEnabled', 'Vibrations'],
            ] as const).map(([key, label]) => (
              <button key={key} onClick={() => toggle(key)} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                {key === 'vibrationEnabled'
                  ? <Vibrate size={18} className={settings[key] ? 'text-teal-600' : 'text-gray-300'} />
                  : settings[key] ? <Volume2 size={18} className="text-teal-600" /> : <VolumeX size={18} className="text-gray-300" />}
                <span className="flex-1 text-left text-sm font-medium text-gray-800">{label}</span>
                <div className={`w-11 h-6 rounded-full transition-colors relative ${settings[key] ? 'bg-teal-600' : 'bg-gray-200'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </button>
            ))}
          </Card>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Rappels</p>
          <Card className="flex flex-col gap-3">
            <button onClick={toggleReminders} className="flex items-center gap-3">
              <Bell size={18} className={settings.reminders.enabled ? 'text-teal-600' : 'text-gray-300'} />
              <span className="flex-1 text-left text-sm font-medium text-gray-800">Activer les rappels</span>
              <div className={`w-11 h-6 rounded-full transition-colors relative ${settings.reminders.enabled ? 'bg-teal-600' : 'bg-gray-200'}`}>
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.reminders.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </button>

            {settings.reminders.enabled && (
              <>
                <div className="flex gap-1.5">
                  {DAYS.map(d => (
                    <button key={d.value} onClick={() => toggleDay(d.value)}
                      className={`w-9 h-9 rounded-full text-xs font-bold ${settings.reminders.days.includes(d.value) ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" min={0} max={23} value={settings.reminders.hour}
                    onChange={e => updateSettings({ reminders: { ...settings.reminders, hour: Math.min(23, Math.max(0, Number(e.target.value) || 0)) } })}
                    className="w-16 h-10 rounded-lg border-2 border-gray-200 px-2 text-sm font-semibold text-center" />
                  <span className="text-gray-400">h</span>
                  <input type="number" min={0} max={59} value={settings.reminders.minute}
                    onChange={e => updateSettings({ reminders: { ...settings.reminders, minute: Math.min(59, Math.max(0, Number(e.target.value) || 0)) } })}
                    className="w-16 h-10 rounded-lg border-2 border-gray-200 px-2 text-sm font-semibold text-center" />
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-400">
                  <Info size={13} className="shrink-0 mt-0.5" />
                  <p>Rappel affiché quand l&apos;app est ouverte le jour concerné. Les notifications système hors appli dépendent du support de ton navigateur.</p>
                </div>
              </>
            )}
          </Card>
        </div>

        <Link href="/gainage/guide">
          <Card className="flex items-center gap-3 hover:bg-gray-50 transition-colors">
            <BookOpen size={18} className="text-teal-600" />
            <span className="flex-1 text-sm font-medium text-gray-800">Bien réaliser la planche</span>
            <ChevronRight size={16} className="text-gray-300" />
          </Card>
        </Link>
      </div>
      <Navigation space="gainage" />
    </div>
  )
}
