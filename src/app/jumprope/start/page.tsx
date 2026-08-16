'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Zap, Timer as TimerIcon, Repeat, CalendarCheck, Sparkles, PenLine } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const MODES: { href: string; label: string; description: string; Icon: typeof Zap }[] = [
  { href: '/jumprope/session?mode=free', label: 'Séance libre', description: 'Saute à ton rythme, sans objectif fixé', Icon: Sparkles },
  { href: '/jumprope/session?mode=goal_jumps', label: 'Objectif de sauts', description: 'Choisis un nombre de sauts à atteindre', Icon: Zap },
  { href: '/jumprope/session?mode=goal_duration', label: 'Objectif de durée', description: 'Choisis une durée à tenir', Icon: TimerIcon },
  { href: '/jumprope/session?mode=intervals', label: 'Intervalles', description: 'Travail / repos, avec des modèles prêts à l\'emploi', Icon: Repeat },
  { href: '/jumprope/challenge', label: 'Défi quotidien / 7 jours', description: 'Progression sur la journée ou le défi 7 jours', Icon: CalendarCheck },
  { href: '/jumprope/manual-entry', label: 'Saisie manuelle', description: 'Enregistrer une séance déjà réalisée', Icon: PenLine },
]

export default function JumpRopeStartPage() {
  const router = useRouter()

  return (
    <div className="app-content-page bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => router.push('/jumprope')} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <h1 className="text-lg font-black text-gray-900">Choisir un mode de séance</h1>
      </div>

      <div className="flex-1 px-5 pt-2 flex flex-col gap-2.5 page-scroll-gutter">
        {MODES.map(({ href, label, description, Icon }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            className="flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-100 bg-white text-left hover:border-violet-200 hover:bg-violet-50/40 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
              <Icon size={20} className="text-violet-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>
        ))}

        <Card className="bg-gray-50 mt-2">
          <p className="text-xs text-gray-500">
            La corde virtuelle (sans détecter la corde elle-même, seulement tes sauts) et le choix de la méthode de comptage
            se règlent à l&apos;étape suivante, avant de démarrer.
          </p>
        </Card>
      </div>
    </div>
  )
}
