'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useJumpRopeData } from '@/hooks/rope/useJumpRopeData'
import { JUMP_PROGRAMS } from '@/lib/rope/programs'
import { JumpLevel } from '@/types/rope'

const LEVEL_LABELS: Record<JumpLevel, string> = { beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé', expert: 'Expert' }

export default function JumpRopeProgramsPage() {
  const router = useRouter()
  const { hydrated, jumprope, startProgram } = useJumpRopeData()

  if (!hydrated) return null

  const choose = (id: keyof typeof JUMP_PROGRAMS) => {
    startProgram(id)
    router.push('/jumprope')
  }

  return (
    <div className="app-content-page bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <h1 className="font-black text-xl text-gray-900">Choisir un programme</h1>
      </div>

      <div className="flex-1 px-4 pb-8 page-scroll-gutter flex flex-col gap-3">
        {jumprope.activeProgramId && (
          <Card className="bg-gray-50 border-none">
            <p className="text-sm text-gray-600">
              Un programme est déjà en cours. En choisir un nouveau abandonnera l&apos;actuel — il restera consultable dans ton historique.
            </p>
          </Card>
        )}

        {Object.values(JUMP_PROGRAMS).map(program => (
          <button
            key={program.id}
            onClick={() => choose(program.id)}
            className={`text-left p-4 rounded-2xl border-2 transition-colors ${
              jumprope.activeProgramId === program.id ? 'border-violet-600 bg-violet-50' : 'border-gray-100 bg-white hover:border-violet-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-black text-gray-900">{program.name}</p>
              <span className="text-[10px] font-bold uppercase tracking-wide text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
                {LEVEL_LABELS[program.level]}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-2">{program.description}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Sparkles size={12} /> {program.goal}
            </p>
            <div className="flex gap-3 mt-2 text-xs text-gray-500 font-medium">
              <span>{program.weeks} semaines</span>
              <span>{program.sessionsPerWeek}×/semaine</span>
              <span>{program.workouts.length} séances</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
