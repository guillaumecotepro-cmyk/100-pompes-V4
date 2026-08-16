'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Zap, Flame, Heart, Trophy, Medal, Sparkles, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useJumpRopeData } from '@/hooks/rope/useJumpRopeData'
import { JumpMainGoal, JumpLevel, JumpRopeProfile, JumpUnits } from '@/types/rope'
import { TRAINING_DAYS_OPTIONS } from '@/lib/rope/config'
import { JUMP_PROGRAMS } from '@/lib/rope/programs'

const GOALS: { id: JumpMainGoal; label: string; description: string; Icon: typeof Flame }[] = [
  { id: 'lose_weight', label: 'Perdre du poids', description: 'Brûler des calories avec des séances régulières', Icon: Flame },
  { id: 'endurance', label: 'Endurance', description: 'Tenir plus longtemps, souffle et cardio', Icon: Heart },
  { id: 'active_daily', label: 'Rester actif', description: 'Bouger chaque jour, sans pression de performance', Icon: Sparkles },
  { id: 'performance', label: 'Performance', description: 'Progresser en vitesse et en technique', Icon: Zap },
  { id: 'competition', label: 'Compétition', description: 'Préparer un objectif ou un défi précis', Icon: Trophy },
]

const LEVELS: { id: JumpLevel; label: string; description: string }[] = [
  { id: 'beginner', label: 'Débutant', description: "Je découvre ou je reprends après une longue pause" },
  { id: 'intermediate', label: 'Intermédiaire', description: 'Je saute régulièrement, sans difficulté majeure' },
  { id: 'advanced', label: 'Avancé', description: 'Je maîtrise les bases, je veux plus d\'intensité' },
  { id: 'expert', label: 'Expert', description: 'Cadence élevée, figures, entraînement poussé' },
]

const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

function suggestedProgram(goal: JumpMainGoal, level: JumpLevel) {
  if (level === 'beginner') return JUMP_PROGRAMS['first-steps']
  if (goal === 'endurance') return JUMP_PROGRAMS['iron-lungs']
  if (goal === 'performance' || goal === 'competition' || level === 'advanced' || level === 'expert') return JUMP_PROGRAMS.afterburn
  return JUMP_PROGRAMS['burn-sculpt']
}

export default function JumpRopeOnboardingPage() {
  const router = useRouter()
  const { saveProfile, startProgram } = useJumpRopeData()

  const [step, setStep] = useState(1)
  const [mainGoal, setMainGoal] = useState<JumpMainGoal | null>(null)
  const [level, setLevel] = useState<JumpLevel | null>(null)
  const [ageYears, setAgeYears] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [units, setUnits] = useState<JumpUnits>('metric')
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(3)
  const [preferredDays, setPreferredDays] = useState<number[]>([0, 2, 4])

  const canContinueStep1 = mainGoal !== null
  const canContinueStep2 = level !== null

  const togglePreferredDay = (dayIndex: number) => {
    setPreferredDays(prev => prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex].sort((a, b) => a - b))
  }

  const finish = () => {
    if (!mainGoal || !level) return
    const profile: JumpRopeProfile = {
      ageYears: ageYears ? Number(ageYears) : null,
      gender: null,
      heightCm: heightCm ? Number(heightCm) : null,
      weightKg: weightKg ? Number(weightKg) : null,
      units,
      mainGoal,
      level,
      trainingDaysPerWeek,
      preferredDays,
      reminderTime: null,
      preferredSessionDurationSeconds: 600,
    }
    saveProfile(profile)
    if (program) startProgram(program.id)
    router.push('/jumprope')
  }

  const back = () => {
    if (step > 1) setStep(step - 1)
    else router.push('/')
  }

  const program = mainGoal && level ? suggestedProgram(mainGoal, level) : null

  return (
    <div className="app-content-page bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={back} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <div className="flex-1 flex gap-1.5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-violet-600' : 'bg-gray-100'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 pt-2 flex flex-col gap-6 page-scroll-gutter">
        {step === 1 && (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-black text-gray-900">Quel est ton objectif principal ?</h1>
              <p className="text-sm text-gray-500">On adapte le programme suggéré en fonction de ta réponse.</p>
            </div>
            <div className="flex flex-col gap-2.5">
              {GOALS.map(({ id, label, description, Icon }) => (
                <button
                  key={id}
                  onClick={() => setMainGoal(id)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-colors ${
                    mainGoal === id ? 'border-violet-600 bg-violet-50' : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${mainGoal === id ? 'bg-violet-600' : 'bg-gray-100'}`}>
                    <Icon size={18} className={mainGoal === id ? 'text-white' : 'text-gray-500'} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{label}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-black text-gray-900">Quel est ton niveau ?</h1>
              <p className="text-sm text-gray-500">Sois honnête avec toi-même, le programme s&apos;ajustera ensuite.</p>
            </div>
            <div className="flex flex-col gap-2.5">
              {LEVELS.map(({ id, label, description }) => (
                <button
                  key={id}
                  onClick={() => setLevel(id)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-colors ${
                    level === id ? 'border-violet-600 bg-violet-50' : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${level === id ? 'bg-violet-600' : 'bg-gray-100'}`}>
                    <Medal size={18} className={level === id ? 'text-white' : 'text-gray-500'} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{label}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-black text-gray-900">Ton profil (facultatif)</h1>
              <p className="text-sm text-gray-500">Ces infos affinent l&apos;estimation des calories. Tu peux tout laisser vide.</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setUnits('metric')}
                className={`flex-1 h-10 rounded-xl text-sm font-semibold ${units === 'metric' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Métrique (kg, cm)
              </button>
              <button
                onClick={() => setUnits('imperial')}
                className={`flex-1 h-10 rounded-xl text-sm font-semibold ${units === 'imperial' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Impérial (lb, in)
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 font-medium">Âge</span>
                <input type="number" inputMode="numeric" value={ageYears} onChange={e => setAgeYears(e.target.value)}
                  placeholder="—" className="h-11 rounded-xl border border-gray-200 px-3 text-center font-semibold text-gray-900" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 font-medium">Taille ({units === 'metric' ? 'cm' : 'in'})</span>
                <input type="number" inputMode="numeric" value={heightCm} onChange={e => setHeightCm(e.target.value)}
                  placeholder="—" className="h-11 rounded-xl border border-gray-200 px-3 text-center font-semibold text-gray-900" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 font-medium">Poids ({units === 'metric' ? 'kg' : 'lb'})</span>
                <input type="number" inputMode="numeric" value={weightKg} onChange={e => setWeightKg(e.target.value)}
                  placeholder="—" className="h-11 rounded-xl border border-gray-200 px-3 text-center font-semibold text-gray-900" />
              </label>
            </div>

            <Card className="bg-amber-50 border-amber-200 flex gap-2.5">
              <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Les calories affichées sont une <strong>estimation</strong> basée sur ta cadence et ton poids, pas une mesure médicale.
                Sans poids renseigné, une valeur moyenne (70 kg) est utilisée.
              </p>
            </Card>
          </>
        )}

        {step === 4 && (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-black text-gray-900">Ta disponibilité</h1>
              <p className="text-sm text-gray-500">Combien de séances par semaine, et quels jours ?</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">Séances par semaine</p>
              <div className="flex gap-2">
                {TRAINING_DAYS_OPTIONS.map(n => (
                  <button
                    key={n}
                    onClick={() => setTrainingDaysPerWeek(n)}
                    className={`flex-1 h-11 rounded-xl font-bold text-sm ${trainingDaysPerWeek === n ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">Jours préférés</p>
              <div className="flex flex-col gap-2">
                {WEEKDAYS.map((day, i) => (
                  <button
                    key={day}
                    onClick={() => togglePreferredDay(i)}
                    className={`flex items-center justify-between px-4 h-11 rounded-xl text-sm font-semibold ${
                      preferredDays.includes(i) ? 'bg-violet-50 text-violet-700 border-2 border-violet-600' : 'bg-gray-50 text-gray-600 border-2 border-transparent'
                    }`}
                  >
                    {day}
                    {preferredDays.includes(i) && <span className="text-violet-600">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 5 && program && (
          <>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
                <Sparkles size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-black text-gray-900">Ton plan est prêt</h1>
              <p className="text-sm text-gray-500">Voici ce qu&apos;on te propose pour commencer, tu pourras changer à tout moment.</p>
            </div>

            <Card elevated className="bg-violet-50 border-violet-200">
              <p className="text-xs font-semibold text-violet-700">Programme suggéré</p>
              <p className="text-lg font-black text-gray-900 mt-0.5">{program.name}</p>
              <p className="text-sm text-violet-800 mt-1">{program.description}</p>
              <div className="flex gap-4 mt-3 text-xs text-violet-700 font-medium">
                <span>{program.weeks} semaines</span>
                <span>{program.sessionsPerWeek}×/semaine</span>
                <span>{program.workouts.length} séances</span>
              </div>
            </Card>

            <Card className="bg-gray-50 flex flex-col gap-1.5 text-sm text-gray-600">
              <p><strong className="text-gray-900">Objectif :</strong> {GOALS.find(g => g.id === mainGoal)?.label}</p>
              <p><strong className="text-gray-900">Niveau :</strong> {LEVELS.find(l => l.id === level)?.label}</p>
              <p><strong className="text-gray-900">Disponibilité :</strong> {trainingDaysPerWeek}×/semaine</p>
            </Card>
          </>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-4">
          {step < 5 ? (
            <Button
              size="xl" fullWidth
              disabled={(step === 1 && !canContinueStep1) || (step === 2 && !canContinueStep2)}
              onClick={() => setStep(step + 1)}
            >
              Continuer <ChevronRight size={20} />
            </Button>
          ) : (
            <Button size="xl" fullWidth onClick={finish}>
              Créer mon profil <ChevronRight size={20} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
