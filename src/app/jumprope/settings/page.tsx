'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Volume2, VolumeX, Vibrate, Bell, ChevronRight, User, Camera, Smartphone, PenLine, RotateCcw, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Navigation } from '@/components/Navigation'
import { useJumpRopeData } from '@/hooks/rope/useJumpRopeData'
import { ANNOUNCE_EVERY_OPTIONS } from '@/lib/rope/config'
import { JumpCountingMethod } from '@/types/rope'

const METHOD_OPTIONS: { id: JumpCountingMethod; label: string; Icon: typeof Camera }[] = [
  { id: 'camera', label: 'Caméra', Icon: Camera },
  { id: 'motion', label: 'Mouvement', Icon: Smartphone },
  { id: 'manual', label: 'Manuel', Icon: PenLine },
]

export default function JumpRopeSettingsPage() {
  const router = useRouter()
  const { hydrated, jumprope, updateSettings, resetData } = useJumpRopeData()
  const [confirmReset, setConfirmReset] = useState(false)

  if (!hydrated) return null
  const { settings } = jumprope

  const toggle = (key: 'voiceEnabled' | 'beepEnabled' | 'gongEnabled' | 'vibrationEnabled' | 'announceHalfway') => {
    updateSettings({ [key]: !settings[key] })
  }

  return (
    <div className="app-page bg-gray-50">
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <h1 className="text-xl font-black text-gray-900">Réglages Corde à sauter</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-5">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Méthode de comptage préférée</p>
          <div className="flex gap-2">
            {METHOD_OPTIONS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => updateSettings({ preferredCountingMethod: id })}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 ${settings.preferredCountingMethod === id ? 'border-violet-600 bg-violet-50' : 'border-gray-100 bg-white'}`}>
                <Icon size={18} className={settings.preferredCountingMethod === id ? 'text-violet-600' : 'text-gray-400'} />
                <span className="text-xs font-semibold text-gray-700">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Audio et vibrations</p>
          <Card className="flex flex-col divide-y divide-gray-100">
            {([
              ['voiceEnabled', 'Voix (annonces, décompte)'],
              ['beepEnabled', 'Bips'],
              ['gongEnabled', 'Gong (fin de séance, records)'],
              ['vibrationEnabled', 'Vibrations'],
            ] as const).map(([key, label]) => (
              <button key={key} onClick={() => toggle(key)} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                {key === 'vibrationEnabled'
                  ? <Vibrate size={18} className={settings[key] ? 'text-violet-600' : 'text-gray-300'} />
                  : settings[key] ? <Volume2 size={18} className="text-violet-600" /> : <VolumeX size={18} className="text-gray-300" />}
                <span className="flex-1 text-left text-sm font-medium text-gray-800">{label}</span>
                <div className={`w-11 h-6 rounded-full transition-colors relative ${settings[key] ? 'bg-violet-600' : 'bg-gray-200'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </button>
            ))}
          </Card>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Annonces vocales</p>
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">Annoncer tous les</span>
              <div className="flex gap-1.5">
                {ANNOUNCE_EVERY_OPTIONS.map(n => (
                  <button key={n} onClick={() => updateSettings({ announceEveryNJumps: n })}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${settings.announceEveryNJumps === n ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {n === 0 ? 'Jamais' : n}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => toggle('announceHalfway')} className="flex items-center gap-3">
              <span className="flex-1 text-left text-sm font-medium text-gray-800">Annoncer la mi-parcours</span>
              <div className={`w-11 h-6 rounded-full transition-colors relative ${settings.announceHalfway ? 'bg-violet-600' : 'bg-gray-200'}`}>
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.announceHalfway ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </Card>
        </div>

        <Link href="/jumprope/onboarding">
          <Card className="flex items-center gap-3 hover:bg-gray-50 transition-colors">
            <RotateCcw size={18} className="text-violet-600" />
            <span className="flex-1 text-sm font-medium text-gray-800">Relancer l&apos;introduction</span>
            <ChevronRight size={16} className="text-gray-300" />
          </Card>
        </Link>

        <Link href="/account">
          <Card className="flex items-center gap-3 hover:bg-gray-50 transition-colors">
            <User size={18} className="text-violet-600" />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-800 block">Compte &amp; données</span>
              <span className="text-xs text-gray-400 flex items-center gap-1"><Bell size={11} /> Rappels, synchronisation, export</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </Card>
        </Link>

        <div>
          {confirmReset ? (
            <Card className="border-2 border-red-200 bg-red-50 flex flex-col gap-2">
              <p className="text-sm text-red-800">Toutes les données Corde à sauter (séances, badges, programme) seront supprimées définitivement. Pompes et Gainage ne sont pas concernés.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmReset(false)} className="flex-1 h-10 rounded-xl border border-red-200 text-sm font-semibold text-red-700">Annuler</button>
                <button onClick={() => { resetData(); router.push('/jumprope/onboarding') }} className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-semibold">Confirmer</button>
              </div>
            </Card>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="flex items-center gap-2 text-sm font-semibold text-red-500">
              <Trash2 size={15} /> Supprimer les données Corde à sauter
            </button>
          )}
        </div>
      </div>
      <Navigation space="jumprope" />
    </div>
  )
}
