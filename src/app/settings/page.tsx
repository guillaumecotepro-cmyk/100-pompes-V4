'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Smartphone, Camera, Hand, AlertTriangle, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Navigation } from '@/components/Navigation'
import { useAppData } from '@/hooks/useWorkoutProgram'
import { SensorMode } from '@/types'

const SENSOR_OPTIONS: { mode: SensorMode; Icon: typeof Smartphone; label: string; desc: string }[] = [
  { mode: 'accelerometer', Icon: Smartphone, label: 'Capteur de mouvement', desc: 'Téléphone sur le dos' },
  { mode: 'camera',        Icon: Camera,     label: 'Caméra frontale',       desc: 'Téléphone au sol' },
  { mode: 'tap',           Icon: Hand,       label: 'Tap manuel',            desc: 'Appui écran' },
]

export default function SettingsPage() {
  const router = useRouter()
  const { data, setSensorMode, resetApp } = useAppData()
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  const handleReset = () => {
    resetApp()
    setResetDone(true)
    setTimeout(() => router.replace('/'), 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <h1 className="text-xl font-black text-gray-900">Paramètres</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-5">
        {/* Sensor mode */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mode de détection</p>
          <div className="flex flex-col gap-2">
            {SENSOR_OPTIONS.map(({ mode, Icon, label, desc }) => (
              <button key={mode}
                onClick={() => setSensorMode(mode)}
                className={`w-full text-left rounded-2xl border-2 p-4 transition-all bg-white ${
                  data.preferredSensorMode === mode ? 'border-brand-500 bg-brand-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={data.preferredSensorMode === mode ? 'text-brand-500' : 'text-gray-400'} />
                  <div>
                    <p className={`text-sm font-semibold ${data.preferredSensorMode === mode ? 'text-brand-800' : 'text-gray-900'}`}>{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                  {data.preferredSensorMode === mode && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recalibrate */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Calibration</p>
          <Card>
            <p className="text-sm text-gray-700 mb-3">
              Recalibrer la détection avant ta prochaine séance.
            </p>
            <Button variant="secondary" size="md" fullWidth onClick={() => router.push('/calibration')}>
              Lancer la calibration
            </Button>
          </Card>
        </div>

        {/* About */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">À propos</p>
          <Card>
            <div className="flex flex-col gap-1 text-sm text-gray-600">
              <p><span className="font-semibold">100 Pompes</span> v0.1.0</p>
              <p className="text-xs text-gray-400">Données stockées localement sur cet appareil. Aucune connexion requise.</p>
            </div>
          </Card>
        </div>

        {/* Danger zone */}
        <div>
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Zone de danger</p>
          {!confirmReset ? (
            <Card className="border-red-100">
              <p className="text-sm text-gray-600 mb-3">
                Réinitialiser toutes les données. Cette action est irréversible.
              </p>
              <Button variant="danger" size="md" fullWidth onClick={() => setConfirmReset(true)}>
                <AlertTriangle size={16} /> Réinitialiser l'application
              </Button>
            </Card>
          ) : resetDone ? (
            <Card className="text-center py-4">
              <p className="text-emerald-600 font-semibold">Données supprimées. Redirection...</p>
            </Card>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-red-200 bg-red-50">
                <p className="text-sm font-semibold text-red-800 mb-1">Tu es sûr(e) ?</p>
                <p className="text-xs text-red-700 mb-3">
                  Toutes tes séances, ton programme et tes statistiques seront perdus définitivement.
                </p>
                <div className="flex gap-3">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => setConfirmReset(false)}>
                    Annuler
                  </Button>
                  <Button variant="danger" size="sm" className="flex-1" onClick={handleReset}>
                    <RefreshCw size={14} /> Oui, réinitialiser
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  )
}
