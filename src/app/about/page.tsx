'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  Target,
  Zap,
  TrendingUp,
  Calendar,
  Award,
  BarChart2,
  Smartphone,
  Activity,
  CheckCircle,
  Info,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'

const APP_VERSION = '1.0.0'

const sections = [
  {
    icon: Target,
    color: 'bg-brand-50 text-brand-500',
    title: "L'objectif",
    content: [
      "100 Pompes a un seul but : t'amener à réaliser 100 pompes d'affilée, peu importe ton niveau de départ.",
      "Que tu en fasses 5 ou 50 aujourd'hui, le programme s'adapte à toi et t'amène progressivement là où tu veux aller — sans te blesser, sans te décourager.",
    ],
  },
  {
    icon: Smartphone,
    color: 'bg-amber-50 text-amber-500',
    title: 'Le système de tap par le nez',
    content: [
      "Chaque pompe se compte en touchant l'écran avec le bout du nez au point le plus bas de ta descente.",
      "Ce système n'est pas anodin : il t'oblige à descendre réellement jusqu'au sol à chaque répétition. Pas de triche possible. Chaque pompe comptée est une vraie pompe complète.",
      "Résultat : tu progresses plus vite, avec une technique irréprochable, et tu renforces vraiment ton corps.",
    ],
    highlight: '💡 Une pompe comptée = une vraie pompe effectuée',
  },
  {
    icon: Calendar,
    color: 'bg-blue-50 text-blue-500',
    title: 'Un programme adaptatif',
    content: [
      "Après ton test initial, l'application génère un programme personnalisé sur plusieurs semaines, avec 3 séances par semaine.",
      "Chaque séance est composée de séries progressives. La charge augmente doucement pour respecter les capacités de récupération de ton corps.",
      "Si tu as besoin d'un jour de repos supplémentaire, prends-le — le programme t'attend. Tu choisis toi-même quand tu t'entraînes.",
    ],
  },
  {
    icon: Activity,
    color: 'bg-emerald-50 text-emerald-500',
    title: 'Tests Performance Max',
    content: [
      "À tout moment, tu peux lancer un test Performance Max : fais le maximum de pompes en une seule série, sans programme, juste pour mesurer où tu en es.",
      "Ces tests sont enregistrés séparément de tes séances et constituent un indicateur objectif de ta progression réelle.",
      "C'est aussi un excellent outil de motivation : voir son record battu est l'une des meilleures récompenses qui soit.",
    ],
  },
  {
    icon: TrendingUp,
    color: 'bg-purple-50 text-purple-500',
    title: 'Suis ta progression',
    content: [
      "100 Pompes suit automatiquement chaque séance : nombre de pompes, durée, séries complétées, évolution par rapport à la semaine précédente.",
      "Le tableau de progression te montre ton arc de performance sur la durée — pas seulement la dernière séance, mais toute ton évolution depuis le premier jour.",
    ],
  },
  {
    icon: Award,
    color: 'bg-rose-50 text-rose-500',
    title: 'Badges & Récompenses',
    content: [
      "L'application récompense la régularité autant que la performance. Des badges sont débloqués au fil des étapes : première séance, premier pallier de pompes, streak hebdomadaire, records personnels...",
      "Ces petites victoires maintiennent la motivation sur la durée — parce que progresser prend du temps, et chaque étape mérite d'être célébrée.",
    ],
  },
  {
    icon: BarChart2,
    color: 'bg-teal-50 text-teal-500',
    title: 'Données 100% locales',
    content: [
      "Toutes tes données restent sur ton téléphone. Pas de compte, pas de serveur, pas de synchronisation cloud. L'application fonctionne entièrement hors ligne.",
      "Ta progression t'appartient.",
    ],
  },
]

const values = [
  { icon: '⚡', label: 'Simple',     desc: '3 boutons maximum pendant une séance' },
  { icon: '🎯', label: 'Efficace',   desc: 'Chaque pompe compte. Vraiment.' },
  { icon: '📈', label: 'Progressif', desc: 'Pas de plateau, toujours une prochaine étape' },
  { icon: '🔒', label: 'Privé',      desc: 'Zéro donnée envoyée, zéro compte requis' },
]

export default function AboutPage() {
  const router = useRouter()

  return (
    <div className="app-content-page bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900">En savoir +</h1>
          <p className="text-xs text-gray-400">100 Pompes v{APP_VERSION}</p>
        </div>
      </div>

      <div className="px-4 py-6 flex flex-col gap-6 max-w-lg mx-auto w-full pb-16">

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="rounded-3xl bg-gradient-to-br from-brand-500 to-orange-400 p-6 text-white shadow-xl shadow-orange-200">
            <div className="text-4xl font-black leading-tight mb-2">
              De 0 à 100 pompes<br />
              <span className="text-white/70">d&apos;affilée.</span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              Un programme progressif, un comptage par le nez, et une envie de progresser.
              C&apos;est tout ce qu&apos;il faut.
            </p>
          </div>
        </motion.div>

        {/* Values grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="grid grid-cols-2 gap-3"
        >
          {values.map(({ icon, label, desc }) => (
            <Card key={label} className="flex flex-col gap-1 py-4">
              <span className="text-2xl">{icon}</span>
              <p className="font-bold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-500 leading-snug">{desc}</p>
            </Card>
          ))}
        </motion.div>

        {/* Sections */}
        {sections.map(({ icon: Icon, color, title, content, highlight }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06, duration: 0.4 }}
          >
            <Card className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={20} />
                </div>
                <h2 className="font-black text-gray-900 text-base">{title}</h2>
              </div>
              <div className="flex flex-col gap-2">
                {content.map((para, j) => (
                  <p key={j} className="text-sm text-gray-600 leading-relaxed">{para}</p>
                ))}
              </div>
              {highlight && (
                <div className="rounded-2xl bg-brand-50 border border-brand-100 px-4 py-3">
                  <p className="text-sm font-semibold text-brand-700">{highlight}</p>
                </div>
              )}
            </Card>
          </motion.div>
        ))}

        {/* Comment ça marche - steps */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
                <Zap size={20} className="text-gray-600" />
              </div>
              <h2 className="font-black text-gray-900 text-base">En 4 étapes</h2>
            </div>
            <ol className="flex flex-col gap-4">
              {[
                { n: '1', t: 'Test initial', d: 'Fais ton maximum de pompes. Le programme se génère automatiquement selon ton score.' },
                { n: '2', t: 'Entraîne-toi', d: "Lance une séance, pose ton téléphone devant toi, et tape l'écran avec le bout du nez à chaque pompe." },
                { n: '3', t: 'Récupère', d: 'Tu choisis tes jours de repos. Le programme t\'attend, sans pression.' },
                { n: '4', t: 'Mesure-toi', d: 'Lance un test Performance Max quand tu le souhaites pour voir ta progression réelle.' },
              ].map(({ n, t, d }) => (
                <li key={n} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-brand-500 text-white font-black text-sm flex items-center justify-center shrink-0">
                    {n}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </motion.div>

        {/* Version footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col items-center gap-1 pt-2 pb-4"
        >
          <div className="flex items-center gap-2 text-brand-500">
            <CheckCircle size={16} />
            <span className="text-sm font-semibold">100 Pompes v{APP_VERSION}</span>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Gratuit · Hors ligne · Aucun compte requis
          </p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-300">
            <Info size={11} />
            <span>Données stockées localement sur ton appareil</span>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
