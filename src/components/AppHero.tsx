'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const HERO_IMAGES = [
  '/hero/pushup-1.png',
  '/hero/pushup-2.webp',
  '/hero/pushup-3.webp',
  '/hero/pushup-4.png',
  '/hero/pushup-5.png',
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

export function AppHero() {
  const pathname = usePathname()
  const isGainage = pathname === '/gainage' || pathname.startsWith('/gainage/')

  return (
    <div className="app-hero">
      {isGainage ? (
        <div className="app-hero__image app-hero__image--gainage" />
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
