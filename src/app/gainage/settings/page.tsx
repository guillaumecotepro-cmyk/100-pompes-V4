'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Volume2, VolumeX, Vibrate, Bell, BookOpen, ChevronRight, User } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Navigation } from '@/components/Navigation'
import { usePlankData } from '@/hooks/plank/usePlankData'

export default function GainageSettingsPage() {
  const router = useRouter()
  const { hydrated, gainage, updateSettings } = usePlankData()

  if (!hydrated) return null
  const { settings } = gainage

  const toggle = (key: 'voiceEnabled' | 'beepEnabled' | 'gongEnabled' | 'vibrationEnabled') => {
    updateSettings({ [key]: !settings[key] })
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

        <Link href="/gainage/guide">
          <Card className="flex items-center gap-3 hover:bg-gray-50 transition-colors">
            <BookOpen size={18} className="text-teal-600" />
            <span className="flex-1 text-sm font-medium text-gray-800">Bien réaliser la planche</span>
            <ChevronRight size={16} className="text-gray-300" />
          </Card>
        </Link>

        <Link href="/account">
          <Card className="flex items-center gap-3 hover:bg-gray-50 transition-colors">
            <User size={18} className="text-teal-600" />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-800 block">Compte &amp; données</span>
              <span className="text-xs text-gray-400 flex items-center gap-1"><Bell size={11} /> Rappels, synchronisation, export</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </Card>
        </Link>
      </div>
      <Navigation space="gainage" />
    </div>
  )
}
