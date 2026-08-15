import { AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const CONSIGNES = [
  { title: 'Coudes sous les épaules', desc: 'Avant-bras au sol, coudes alignés verticalement sous les épaules.' },
  { title: 'Corps aligné', desc: 'Tête, dos et jambes forment une ligne droite, sans creuser le dos.' },
  { title: 'Bassin neutre', desc: 'Ni relevé ni affaissé — contracte légèrement les abdominaux et les fessiers.' },
  { title: 'Respiration régulière', desc: 'Respire normalement, ne bloque pas ta respiration.' },
  { title: 'Arrêt immédiat si besoin', desc: 'Arrête dès la moindre douleur ou dès que la posture se dégrade nettement.' },
]

export function PlankGuideCard() {
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <h2 className="font-bold text-lg text-gray-900 mb-3">Bien réaliser la planche</h2>
        <ol className="flex flex-col gap-2.5 text-sm text-gray-600">
          {CONSIGNES.map((c, i) => (
            <li key={c.title} className="flex gap-2">
              <span className="text-teal-600 font-bold shrink-0">{i + 1}.</span>
              <span><span className="font-semibold text-gray-800">{c.title}.</span> {c.desc}</span>
            </li>
          ))}
        </ol>
      </Card>
      <Card className="bg-amber-50 border-amber-200 flex items-start gap-2.5">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          Le gainage renforce le tronc et progresse avec la régularité. En cas de douleur, de problème de dos connu
          ou du moindre doute, arrête l&apos;exercice et demande conseil à un professionnel de santé.
        </p>
      </Card>
    </div>
  )
}
