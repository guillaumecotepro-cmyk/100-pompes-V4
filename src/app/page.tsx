'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight, Zap, Target, TrendingUp, Smartphone, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAppData } from '@/hooks/useWorkoutProgram'

const FEATURES = [
  { Icon: Target,     title: 'Test initial',         desc: 'Évalue ton niveau et reçois un programme personnalisé.' },
  { Icon: Zap,        title: 'Comptage par le nez',   desc: 'Chaque pompe se valide en touchant l\'écran avec le bout du nez.' },
  { Icon: TrendingUp, title: 'Progression visuelle',  desc: 'Suivi complet, badges, records et statistiques.' },
  { Icon: Smartphone, title: 'Conçu pour l\'iPhone',  desc: 'Mobile-first, rapide, sans connexion requise.' },
]

export default function LandingPage() {
  const router = useRouter()
  const { data, hydrated } = useAppData()

  useEffect(() => {
    if (hydrated && data.onboarded) {
      router.replace('/dashboard')
    }
  }, [hydrated, data.onboarded, router])

  if (!hydrated) return null

  return (
    <main className="app-content-page flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <img
            src="/logo-100-pompes.jpg"
            alt="100 Pompes"
            className="mx-auto mb-6 h-24 w-24 rounded-xl border border-orange-100 object-cover shadow-lg shadow-orange-100"
          />
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-600 rounded-full px-4 py-1.5 text-sm font-semibold mb-5">
            <Zap size={14} /> Programme adaptatif
          </div>
          <h1 className="text-5xl font-black text-gray-900 leading-tight mb-4">
            100<span className="text-brand-gradient"> Pompes</span>
            <br />d'affilée
          </h1>
          <p className="text-gray-500 text-lg max-w-xs mx-auto leading-relaxed">
            Peu importe ton niveau aujourd'hui.
            Ton programme t'amènera là où tu veux aller.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-10 w-full max-w-xs"
        >
          <Link href="/onboarding">
            <Button size="xl" fullWidth>
              Commencer <ChevronRight size={20} />
            </Button>
          </Link>
          <p className="text-xs text-gray-400 mt-3">Gratuit · Aucun compte requis</p>
        </motion.div>
      </div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="px-4 pb-12 flex flex-col gap-3 max-w-md mx-auto w-full"
      >
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-2">
          Comment ça marche
        </p>
        {FEATURES.map(({ Icon, title, desc }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
          >
            <Card className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-brand-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </Card>
          </motion.div>
        ))}

        {/* En savoir + */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1 }}
        >
          <Link href="/about">
            <Card className="flex items-center gap-3 border-brand-100 bg-brand-50 hover:bg-brand-100 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shrink-0">
                <Info size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-brand-900 text-sm">En savoir +</p>
                <p className="text-xs text-brand-600 mt-0.5">Comment fonctionne l'app en détail</p>
              </div>
              <ChevronRight size={16} className="text-brand-400" />
            </Card>
          </Link>
        </motion.div>
      </motion.div>
    </main>
  )
}
