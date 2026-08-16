'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Play, TrendingUp, User, History, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const POMPES_NAV_ITEMS = [
  { href: '/dashboard', label: 'Accueil',    Icon: LayoutDashboard },
  { href: '/workout',   label: 'Séance',     Icon: Play },
  { href: '/progress',  label: 'Progression',Icon: TrendingUp },
  { href: '/profile',   label: 'Profil',     Icon: User },
]

const GAINAGE_NAV_ITEMS = [
  { href: '/gainage',         label: 'Accueil',    Icon: LayoutDashboard },
  { href: '/gainage/free',    label: 'Libre',      Icon: Play },
  { href: '/gainage/history', label: 'Historique', Icon: History },
  { href: '/profile',         label: 'Profil',     Icon: User },
]

const JUMPROPE_NAV_ITEMS = [
  { href: '/jumprope',         label: 'Accueil',    Icon: LayoutDashboard },
  { href: '/jumprope/start',   label: 'Séance',     Icon: Timer },
  { href: '/jumprope/history', label: 'Historique', Icon: History },
  { href: '/profile',          label: 'Profil',     Icon: User },
]

interface NavigationProps {
  /** 'pompes' (défaut, comportement historique inchangé), 'gainage' ou 'jumprope'. */
  space?: 'pompes' | 'gainage' | 'jumprope'
}

export function Navigation({ space = 'pompes' }: NavigationProps) {
  const pathname = usePathname()
  const NAV_ITEMS = space === 'gainage' ? GAINAGE_NAV_ITEMS : space === 'jumprope' ? JUMPROPE_NAV_ITEMS : POMPES_NAV_ITEMS

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-100">
      <div className="grid grid-cols-4 max-w-md mx-auto">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isRoot = href === '/dashboard' || href === '/gainage' || href === '/jumprope'
          const active = pathname === href || (!isRoot && pathname.startsWith(href + '/'))
          return (
            <Link key={href} href={href}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 transition-colors',
                active ? 'text-brand-500' : 'text-gray-400'
              )}>
              <div className="relative">
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 -m-1.5 bg-brand-50 rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={22} className="relative z-10" />
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
