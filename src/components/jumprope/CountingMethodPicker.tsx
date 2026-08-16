'use client'
import { Camera, Smartphone, PenLine, Info, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useCameraJumpCounter } from '@/hooks/rope/useCameraJumpCounter'
import { useMotionJumpCounter } from '@/hooks/rope/useMotionJumpCounter'
import { JumpCountingMethod } from '@/types/rope'
import { cn } from '@/lib/utils'

const FRAMING_MESSAGES: Record<string, string> = {
  no_body: 'Aucun corps détecté — place-toi face à la caméra',
  too_close: 'Trop proche — recule un peu',
  too_far: 'Trop loin — rapproche-toi de la caméra',
  feet_not_visible: 'Pieds non visibles — cadre tout ton corps',
  low_confidence: 'Détection incertaine — vérifie la luminosité',
}

interface CountingMethodPickerProps {
  camera: ReturnType<typeof useCameraJumpCounter>
  motion: ReturnType<typeof useMotionJumpCounter>
  selected: JumpCountingMethod | null
  onSelect: (method: JumpCountingMethod) => void
  onReady: (method: JumpCountingMethod) => void
}

export function CountingMethodPicker({ camera, motion, selected, onSelect, onReady }: CountingMethodPickerProps) {
  const cameraLive = selected === 'camera' && camera.permission === 'granted'

  const chooseCamera = () => { onSelect('camera'); if (camera.permission === 'idle') void camera.requestPermission() }
  const chooseMotion = () => { onSelect('motion'); if (motion.permission === 'idle') void motion.requestPermission() }
  const chooseManual = () => onSelect('manual')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className={cn('text-xl font-black', cameraLive ? 'text-white' : 'text-gray-900')}>Comment compter tes sauts ?</h1>
        <p className={cn('text-sm', cameraLive ? 'text-white/80' : 'text-gray-500')}>Tu peux changer de méthode à tout moment depuis les réglages.</p>
      </div>

      <div className={cn('flex flex-col gap-2.5', cameraLive && 'p-3 rounded-2xl bg-black/35 backdrop-blur-sm')}>
        <button
          onClick={chooseCamera}
          className={cn(
            'flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-colors',
            selected === 'camera'
              ? cameraLive ? 'border-violet-400 bg-white/15' : 'border-violet-600 bg-violet-50'
              : cameraLive ? 'border-white/20 bg-black/20' : 'border-gray-100 bg-white'
          )}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selected === 'camera' ? 'bg-violet-600' : cameraLive ? 'bg-white/10' : 'bg-gray-100'}`}>
            <Camera size={18} className={selected === 'camera' ? 'text-white' : cameraLive ? 'text-white/70' : 'text-gray-500'} />
          </div>
          <div>
            <p className={cn('font-bold text-sm', cameraLive ? 'text-white' : 'text-gray-900')}>Caméra</p>
            <p className={cn('text-xs', cameraLive ? 'text-white/70' : 'text-gray-500')}>Analyse ta posture en local, sans jamais envoyer la vidéo</p>
          </div>
        </button>

        <button
          onClick={chooseMotion}
          className={cn(
            'flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-colors',
            selected === 'motion'
              ? cameraLive ? 'border-violet-400 bg-white/15' : 'border-violet-600 bg-violet-50'
              : cameraLive ? 'border-white/20 bg-black/20' : 'border-gray-100 bg-white'
          )}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selected === 'motion' ? 'bg-violet-600' : cameraLive ? 'bg-white/10' : 'bg-gray-100'}`}>
            <Smartphone size={18} className={selected === 'motion' ? 'text-white' : cameraLive ? 'text-white/70' : 'text-gray-500'} />
          </div>
          <div>
            <p className={cn('font-bold text-sm', cameraLive ? 'text-white' : 'text-gray-900')}>Mouvement du téléphone</p>
            <p className={cn('text-xs', cameraLive ? 'text-white/70' : 'text-gray-500')}>Téléphone tenu en main ou en brassard — jamais posé au sol</p>
          </div>
        </button>

        <button
          onClick={chooseManual}
          className={cn(
            'flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-colors',
            selected === 'manual'
              ? cameraLive ? 'border-violet-400 bg-white/15' : 'border-violet-600 bg-violet-50'
              : cameraLive ? 'border-white/20 bg-black/20' : 'border-gray-100 bg-white'
          )}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selected === 'manual' ? 'bg-violet-600' : cameraLive ? 'bg-white/10' : 'bg-gray-100'}`}>
            <PenLine size={18} className={selected === 'manual' ? 'text-white' : cameraLive ? 'text-white/70' : 'text-gray-500'} />
          </div>
          <div>
            <p className={cn('font-bold text-sm', cameraLive ? 'text-white' : 'text-gray-900')}>Saisie manuelle</p>
            <p className={cn('text-xs', cameraLive ? 'text-white/70' : 'text-gray-500')}>Tu tapotes toi-même l&apos;écran à chaque saut</p>
          </div>
        </button>
      </div>

      {selected === 'camera' && (
        <Card className={cn('flex flex-col gap-3', cameraLive && 'bg-black/45 backdrop-blur-sm border-white/10')}>
          {camera.permission === 'idle' || camera.permission === 'requesting' ? (
            <div className="flex flex-col gap-2 items-center text-center py-4">
              <Info size={20} className="text-violet-600" />
              <p className="text-sm text-gray-600">
                On a besoin d&apos;accéder à ta caméra pour détecter tes sauts. Rien n&apos;est enregistré ni envoyé — tout reste sur ton téléphone.
              </p>
              <Button onClick={() => void camera.requestPermission()} loading={camera.permission === 'requesting'}>Autoriser la caméra</Button>
            </div>
          ) : camera.permission === 'unsupported' ? (
            <div className="flex flex-col gap-2 items-center text-center py-4">
              <AlertTriangle size={20} className="text-amber-500" />
              <p className="text-sm text-gray-600">Caméra non disponible sur cet appareil ou ce navigateur. Choisis une autre méthode.</p>
            </div>
          ) : camera.permission === 'denied' ? (
            <div className="flex flex-col gap-2 items-center text-center py-4">
              <AlertTriangle size={20} className="text-amber-500" />
              <p className="text-sm text-gray-600">
                Accès caméra refusé. Pour réactiver : ouvre les réglages de ton navigateur (icône caméra dans la barre d&apos;adresse, ou Réglages → Site → Caméra) et autorise l&apos;accès, puis reviens ici.
              </p>
              <Button variant="secondary" onClick={() => void camera.requestPermission()}>Réessayer</Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${camera.detection.bodyVisible ? 'bg-emerald-500 text-white' : 'bg-white/15 text-white'}`}>
                {camera.modelState === 'loading' ? 'Chargement du modèle…' : camera.detection.bodyVisible ? 'Corps détecté' : 'Corps non détecté'}
              </span>
              <button onClick={() => void camera.switchCamera()} className="p-2 rounded-full bg-white/15 text-white shrink-0">
                <RotateCcw size={14} />
              </button>
            </div>
          )}
          {camera.permission === 'granted' && camera.modelState === 'error' && (
            <p className="text-xs text-red-400 text-center">Le modèle de détection n&apos;a pas pu se charger. Choisis une autre méthode.</p>
          )}
          {camera.permission === 'granted' && camera.detection.framingIssue && camera.modelState === 'ready' && (
            <p className="text-xs text-amber-300 text-center font-medium">{FRAMING_MESSAGES[camera.detection.framingIssue]}</p>
          )}
          {camera.permission === 'granted' && !camera.detection.framingIssue && camera.detection.bodyVisible && camera.modelState === 'ready' && (
            <p className="text-xs text-emerald-300 text-center font-medium flex items-center justify-center gap-1">
              <CheckCircle2 size={14} /> Cadrage correct, prêt à démarrer
            </p>
          )}
        </Card>
      )}

      {selected === 'motion' && (
        <Card className="flex flex-col gap-2 items-center text-center py-4">
          {motion.permission === 'idle' || motion.permission === 'requesting' ? (
            <>
              <Info size={20} className="text-violet-600" />
              <p className="text-sm text-gray-600">Tiens ton téléphone en main ou en brassard pendant la séance pour que les sauts soient détectés.</p>
              <Button onClick={() => void motion.requestPermission()} loading={motion.permission === 'requesting'}>Autoriser les capteurs</Button>
            </>
          ) : motion.permission === 'unsupported' ? (
            <>
              <AlertTriangle size={20} className="text-amber-500" />
              <p className="text-sm text-gray-600">Capteurs de mouvement non disponibles sur cet appareil. Choisis une autre méthode.</p>
            </>
          ) : motion.permission === 'denied' ? (
            <>
              <AlertTriangle size={20} className="text-amber-500" />
              <p className="text-sm text-gray-600">
                Accès aux capteurs refusé. Pour réactiver sur iOS : Réglages → Safari → Mouvement et orientation. Puis reviens ici.
              </p>
              <Button variant="secondary" onClick={() => void motion.requestPermission()}>Réessayer</Button>
            </>
          ) : (
            <>
              <CheckCircle2 size={20} className="text-emerald-600" />
              <p className="text-sm text-gray-600 font-medium">Capteurs prêts. Tiens bien le téléphone en main au moment de démarrer.</p>
            </>
          )}
        </Card>
      )}

      {selected === 'manual' && (
        <Card className="flex items-center gap-2.5">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <p className="text-sm text-gray-600">Tu tapoteras le grand bouton à l&apos;écran à chaque saut pendant la séance.</p>
        </Card>
      )}

      <Button
        size="xl" fullWidth
        disabled={
          !selected ||
          (selected === 'camera' && (camera.permission !== 'granted' || camera.modelState !== 'ready')) ||
          (selected === 'motion' && motion.permission !== 'granted')
        }
        onClick={() => selected && onReady(selected)}
      >
        Continuer
      </Button>
    </div>
  )
}
