'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAppData } from '@/hooks/useWorkoutProgram'

const AVATAR_COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#f43f5e', '#eab308']

export default function OnboardingPage() {
  const router = useRouter()
  const { data, setProfile } = useAppData()
  const [step, setStep]   = useState(0)
  const [name, setName]   = useState('')
  const [color, setColor] = useState(AVATAR_COLORS[0])
  const [loading, setLoading] = useState(false)

  const goNext = () => setStep(s => s + 1)
  const goBack = () => step > 0 ? setStep(s => s - 1) : router.back()

  const handleFinish = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 300))
    router.push(`/calibration?name=${encodeURIComponent(name.trim() || 'Athlète')}`)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-14 pb-4">
        <button onClick={goBack} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <div className="flex-1 flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-brand-500' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 py-4">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key={0} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="flex flex-col gap-6 h-full">
              <div>
                <h1 className="text-3xl font-black text-gray-900">Bienvenue !</h1>
                <p className="text-gray-500 mt-2">En quelques étapes, on personnalise ton programme.</p>
              </div>
              <div className="flex flex-col gap-3">
                <Card className="bg-brand-50 border-brand-200">
                  <p className="text-sm font-semibold text-brand-800">Ce qui t'attend :</p>
                  <ul className="mt-2 flex flex-col gap-1.5 text-sm text-brand-700">
                    <li>• Un test initial pour évaluer ton niveau</li>
                    <li>• Un programme adaptatif sur plusieurs semaines</li>
                    <li>• Un comptage automatique des pompes</li>
                    <li>• Des badges et une progression visuelle</li>
                  </ul>
                </Card>
                <Card className="bg-gray-50">
                  <p className="text-xs text-gray-500">Tout est sauvegardé localement sur ton téléphone. Aucun compte requis.</p>
                </Card>
              </div>
              <div className="mt-auto">
                <Button size="xl" fullWidth onClick={goNext}>
                  C'est parti ! <ChevronRight size={20} />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key={1} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="flex flex-col gap-6 h-full">
              <div>
                <h2 className="text-3xl font-black text-gray-900">Comment tu t'appelles ?</h2>
                <p className="text-gray-500 mt-2">Pour personnaliser ton expérience.</p>
              </div>

              {/* Avatar preview */}
              <div className="flex flex-col items-center gap-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg"
                  style={{ backgroundColor: color }}
                >
                  {name ? name[0].toUpperCase() : <User size={32} />}
                </div>
                <div className="flex gap-2">
                  {AVATAR_COLORS.map(c => (
                    <button key={c} onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ton prénom"
                  maxLength={24}
                  className="w-full h-14 rounded-2xl border-2 border-gray-200 px-4 text-lg font-semibold focus:outline-none focus:border-brand-400 transition-colors"
                  autoFocus
                />
              </div>

              <div className="mt-auto">
                <Button size="xl" fullWidth disabled={!name.trim()} onClick={goNext}>
                  Continuer <ChevronRight size={20} />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key={2} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="flex flex-col gap-6 h-full">
              <div>
                <h2 className="text-3xl font-black text-gray-900">
                  Parfait, {name.trim() || 'toi'} !
                </h2>
                <p className="text-gray-500 mt-2">
                  L'étape suivante est ton test initial. Tu vas faire un maximum de pompes en une seule série.
                </p>
              </div>
              <Card className="bg-amber-50 border-amber-200">
                <p className="font-semibold text-amber-900 text-sm mb-1">⚡ Conseil</p>
                <p className="text-sm text-amber-800">
                  Fais ton test à bout de souffle — donne vraiment tout. Cela permet de calibrer ton programme correctement.
                </p>
              </Card>
              <Card>
                <p className="text-sm font-semibold text-gray-700 mb-2">Pour le test tu auras besoin de :</p>
                <ul className="text-sm text-gray-600 flex flex-col gap-1">
                  <li>✓ Un sol dur (pas de lit ou canapé)</li>
                  <li>✓ Un peu d'espace devant toi</li>
                  <li>✓ Ton téléphone à portée de main</li>
                </ul>
              </Card>
              <div className="mt-auto">
                <Button size="xl" fullWidth loading={loading} onClick={handleFinish}>
                  Faire le test initial <ChevronRight size={20} />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
