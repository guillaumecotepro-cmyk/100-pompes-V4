'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Camera, Hand, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { SensorMode } from '@/types'
import { requestAccelerometerPermission } from '@/hooks/usePushupCounter'

type Step = 'choose' | 'setup' | 'test' | 'confirmed'

interface SensorCalibrationProps {
  initialMode?: SensorMode
  onComplete: (mode: SensorMode) => void
}

const MODE_INFO: Record<SensorMode, { icon: React.ReactNode; label: string; description: string; setupText: string }> = {
  accelerometer: {
    icon: <Smartphone size={28} />,
    label: 'Capteur de mouvement',
    description: 'Téléphone sur ton dos ou ta nuque. Détecte les mouvements automatiquement.',
    setupText: 'Place ton téléphone à plat sur ton dos entre les omoplates, écran vers le bas.',
  },
  camera: {
    icon: <Camera size={28} />,
    label: 'Caméra frontale',
    description: 'Téléphone au sol face vers le haut. La caméra détecte ton visage.',
    setupText: 'Pose ton téléphone au sol sous ton visage, caméra vers le haut. Ton visage doit être visible.',
  },
  proximity: {
    icon: <Smartphone size={28} />,
    label: 'Capteur de proximité',
    description: 'Détecte la proximité de ton visage avec l\'écran pendant les pompes.',
    setupText: 'Tiens ton téléphone verticalement, écran face à toi. Rapproche-toi et éloigne-toi de l\'écran.',
  },
  tap: {
    icon: <Hand size={28} />,
    label: 'Tap manuel',
    description: "Tap l'écran à chaque pompe. Simple, fiable, toujours disponible.",
    setupText: "Garde ton téléphone à portée. Tape l'écran à chaque pompe complète.",
  },
}

export function SensorCalibration({ initialMode = 'tap', onComplete }: SensorCalibrationProps) {
  const [step, setStep]       = useState<Step>('choose')
  const [mode, setMode]       = useState<SensorMode>(initialMode)
  const [testCount, setTestCount] = useState(0)
  const [testing, setTesting] = useState(false)
  const [error, setError]     = useState('')
  const [buttonSize, setButtonSize] = useState(144) // default 144px

  const accRef       = useRef(false)
  const smoothed     = useRef(9.8)
  const baseline     = useRef(9.8)
  const samples      = useRef<number[]>([])
  const repState     = useRef<'up' | 'down'>('up')
  const lastRepTime  = useRef(0)
  const streamRef    = useRef<MediaStream | null>(null)

  // Reset test state when mode changes
  useEffect(() => {
    setTestCount(0)
    setError('')
  }, [mode])

  // Calculate button size for 90% screen area
  useEffect(() => {
    const calculateButtonSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const screenArea = width * height
      const buttonArea = 0.9 * screenArea
      const size = Math.sqrt(buttonArea)
      setButtonSize(Math.min(size, Math.min(width * 0.95, height * 0.95))) // cap at 95% to leave some margin
    }
    calculateButtonSize()
    window.addEventListener('resize', calculateButtonSize)
    return () => window.removeEventListener('resize', calculateButtonSize)
  }, [])

  // Cleanup sensor on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      window.removeEventListener('devicemotion', handleMotion as EventListener)
    }
  }, [])

  function handleMotion(e: DeviceMotionEvent) {
    const z = e.accelerationIncludingGravity?.z ?? 0
    if (samples.current.length < 30) {
      samples.current.push(z)
      if (samples.current.length === 30) {
        baseline.current = samples.current.reduce((a, b) => a + b, 0) / 30
      }
      return
    }
    smoothed.current = 0.3 * z + 0.7 * smoothed.current
    const diff = smoothed.current - baseline.current
    const now = Date.now()
    if (repState.current === 'up' && diff < -3.0) {
      repState.current = 'down'
    } else if (repState.current === 'down' && diff > -1.5 && now - lastRepTime.current > 400) {
      repState.current = 'up'
      lastRepTime.current = now
      setTestCount(c => c + 1)
      if (navigator.vibrate) navigator.vibrate(30)
    }
  }

  const startTest = async () => {
    setTestCount(0)
    setError('')
    setTesting(true)

    if (mode === 'accelerometer') {
      samples.current = []
      smoothed.current = 9.8
      baseline.current = 9.8
      repState.current = 'up'
      const ok = await requestAccelerometerPermission()
      if (!ok) {
        setError('Permission refusée. Choisis un autre mode.')
        setTesting(false)
        return
      }
      accRef.current = true
      window.addEventListener('devicemotion', handleMotion as EventListener)
    } else if (mode === 'camera') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        streamRef.current = stream
      } catch {
        setError('Accès caméra refusé. Choisis un autre mode.')
        setTesting(false)
        return
      }
    } else if (mode === 'proximity') {
      // Check if proximity sensor is supported
      const hasProximitySupport = 'ondeviceproximity' in window || 'deviceproximity' in window
      if (!hasProximitySupport) {
        setError('Capteur de proximité non disponible sur cet appareil.')
        setTesting(false)
        return
      }
      // Proximity sensor test logic will be handled in the UI
    }
  }

  const stopTest = () => {
    setTesting(false)
    window.removeEventListener('devicemotion', handleMotion as EventListener)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  const confirm = () => {
    stopTest()
    setStep('confirmed')
    setTimeout(() => onComplete(mode), 800)
  }

  const info = MODE_INFO[mode]

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="wait">
        {step === 'choose' && (
          <motion.div key="choose" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
            <p className="text-gray-600 text-sm">Choisis comment tes pompes seront comptées :</p>
            {(['accelerometer', 'camera', 'proximity', 'tap'] as SensorMode[]).map(m => {
              const info = MODE_INFO[m]
              return (
                <button key={m} onClick={() => setMode(m)}
                  className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${mode === m ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${mode === m ? 'text-brand-500' : 'text-gray-400'}`}>{info.icon}</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{info.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{info.description}</p>
                    </div>
                  </div>
                </button>
              )
            })}
            <Button size="lg" fullWidth className="mt-2" onClick={() => setStep('setup')}>
              Continuer <ChevronRight size={18} />
            </Button>
          </motion.div>
        )}

        {step === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <div className="flex gap-3 items-start">
                <div className="text-blue-500 mt-0.5">{info.icon}</div>
                <div>
                  <p className="font-semibold text-blue-900 text-sm">{info.label}</p>
                  <p className="text-xs text-blue-700 mt-1">{info.setupText}</p>
                </div>
              </div>
            </Card>
            <Button size="lg" fullWidth onClick={async () => { setStep('test'); await startTest() }}>
              Faire un test de détection
            </Button>
            <Button size="md" variant="ghost" fullWidth onClick={() => setStep('choose')}>
              Changer de mode
            </Button>
          </motion.div>
        )}

        {step === 'test' && (
          <motion.div key="test" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-5">
            <div>
              <p className="text-gray-500 text-sm text-center mb-4">
                {mode === 'tap' ? 'Tape l\'écran 3 fois pour tester' : 'Fais 3 pompes test'}
              </p>
              <div className="flex justify-center gap-3">
                {[0,1,2].map(i => (
                  <motion.div key={i}
                    animate={{ scale: testCount > i ? 1 : 0.85, backgroundColor: testCount > i ? '#f97316' : '#e5e7eb' }}
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl"
                  >
                    {testCount > i ? '✓' : i + 1}
                  </motion.div>
                ))}
              </div>
            </div>

            {mode === 'tap' && (
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => setTestCount(c => Math.min(c + 1, 3))}
                className="rounded-full bg-brand-500 text-white font-bold text-lg shadow-xl shadow-brand-200 select-none"
                style={{ width: buttonSize, height: buttonSize }}
              >
                TAP
              </motion.button>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl p-3">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="flex gap-3 w-full">
              <Button variant="secondary" size="md" className="flex-1" onClick={() => { stopTest(); setStep('choose') }}>
                Changer de mode
              </Button>
              <Button size="md" className="flex-1" disabled={testCount < 1} onClick={confirm}>
                Confirmer
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'confirmed' && (
          <motion.div key="confirmed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
              <CheckCircle size={64} className="text-emerald-500" />
            </motion.div>
            <p className="font-bold text-xl text-gray-900">Calibration réussie !</p>
            <p className="text-gray-500 text-sm">Mode : {info.label}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
