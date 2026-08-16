'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const HERO_IMAGES = [
  '/hero/pushup-1.png',
  '/hero/pushup-2.webp',
  '/hero/pushup-3.webp',
  '/hero/pushup-4.png',
  '/hero/pushup-5.png',
]

// Pool Gainage : une image est tirée au hasard à chaque écran (voir getGainageHeroImage).
const GAINAGE_HERO_IMAGES = [
  '/hero/gainage-hero-1.webp',
  '/hero/gainage-hero-2.webp',
  '/hero/gainage-hero-3.jpg',
  '/hero/gainage-hero-4.jpg',
  '/hero/gainage-hero-5.jpg',
]

const PAGE_IMAGE_INDEX: Record<string, number> = {
  '/': 3,
  '/onboarding': 4,
  '/dashboard': 0,
  '/workout': 1,
  '/test': 2,
  '/calibration': 1,
  '/history': 3,
  '/progress': 4,
  '/profile': 0,
  '/settings': 2,
  '/max': 3,
}

function getHeroImage(pathname: string) {
  const key = Object.keys(PAGE_IMAGE_INDEX)
    .sort((a, b) => b.length - a.length)
    .find(path => pathname === path || pathname.startsWith(`${path}/`))

  return HERO_IMAGES[PAGE_IMAGE_INDEX[key ?? '/'] ?? 0]
}

function pickRandomGainageHero() {
  return GAINAGE_HERO_IMAGES[Math.floor(Math.random() * GAINAGE_HERO_IMAGES.length)]
}

// Choix déterministe (même résultat serveur/client) pour le tout premier rendu :
// Math.random() y produirait des valeurs différentes entre le serveur et le
// client et déclencherait un mismatch d'hydratation React.
function deterministicGainageHero(pathname: string) {
  let hash = 0
  for (let i = 0; i < pathname.length; i++) hash = (hash * 31 + pathname.charCodeAt(i)) >>> 0
  return GAINAGE_HERO_IMAGES[hash % GAINAGE_HERO_IMAGES.length]
}

export function AppHero() {
  const pathname = usePathname()
  const isGainage = pathname === '/gainage' || pathname.startsWith('/gainage/')
  const isJumprope = pathname === '/jumprope' || pathname.startsWith('/jumprope/')
  const [gainageHero, setGainageHero] = useState(() => deterministicGainageHero(pathname))

  // Une fois monté côté client (hydratation terminée), on retire une image
  // vraiment aléatoire à chaque écran visité.
  useEffect(() => {
    setGainageHero(pickRandomGainageHero())
  }, [pathname])

  return (
    <div className="app-hero">
      {isJumprope ? (
        // Aucune photo dédiée à la corde à sauter n'existe encore dans public/hero — un fond dégradé
        // à l'accent violet de l'activité évite d'afficher une photo de pompes hors-contexte.
        <div className="app-hero__image app-hero__image--jumprope" />
      ) : isGainage ? (
        <img src={gainageHero} alt="" className="app-hero__image" />
      ) : (
        <img src={getHeroImage(pathname)} alt="" className="app-hero__image" />
      )}
      <div className="app-hero__shade" />
      {/* Lien logo présent sur toutes les pages : moyen unique et cohérent de revenir au choix d'activité. */}
      <Link href="/" className="app-hero__logo" aria-label="Changer d'activité">
        <img src="/logo-100-pompes.jpg" alt="100 Pompes" className="app-hero__logo-image" />
      </Link>
    </div>
  )
}
