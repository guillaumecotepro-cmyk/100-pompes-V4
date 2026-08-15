'use client'
import { useEffect, useState } from 'react'
import { X, Share, Plus } from 'lucide-react'

type Platform = 'ios' | 'android' | null

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return null
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return true
  return (
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true) ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches
  )
}

const DISMISSED_KEY = '100pompes_install_dismissed'

export function InstallPrompt() {
  const [visible, setVisible]     = useState(false)
  const [platform, setPlatform]   = useState<Platform>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)

  useEffect(() => {
    if (isInStandaloneMode()) return
    if (localStorage.getItem(DISMISSED_KEY)) return

    const plat = detectPlatform()
    if (!plat) return
    setPlatform(plat)

    if (plat === 'android') {
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setVisible(true)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }

    // iOS — show after 2s so page is loaded
    const t = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(t)
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  const installAndroid = async () => {
    if (!deferredPrompt) return
    type BeforeInstallPromptEvent = { prompt: () => void; userChoice: Promise<{ outcome: string }> }
    const prompt = deferredPrompt as unknown as BeforeInstallPromptEvent
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') dismiss()
  }

  if (!visible) return null

  return (
    <div className="install-prompt">
      <button
        onClick={dismiss}
        className="install-prompt__close"
        aria-label="Fermer"
      >
        <X size={16} />
      </button>

      {platform === 'ios' && (
        <>
          <p className="install-prompt__title">Plein écran sans barre</p>
          <p className="install-prompt__body">
            Appuie sur <Share size={14} className="install-prompt__inline-icon" /> puis{' '}
            <strong>« Sur l&apos;écran d&apos;accueil »</strong> pour une expérience plein écran.
          </p>
          <div className="install-prompt__arrow" />
        </>
      )}

      {platform === 'android' && (
        <>
          <p className="install-prompt__title">Installer l&apos;application</p>
          <p className="install-prompt__body">Lance l&apos;app en plein écran depuis ton écran d&apos;accueil.</p>
          <button onClick={installAndroid} className="install-prompt__btn">
            <Plus size={16} /> Ajouter à l&apos;écran d&apos;accueil
          </button>
        </>
      )}
    </div>
  )
}
