import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AppHero } from '@/components/AppHero'
import { InstallPrompt } from '@/components/InstallPrompt'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '100 Pompes',
  description: 'Atteignez 100 pompes d\'affilée avec votre programme personnalisé.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '100 Pompes',
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#fffaf4',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>
        <AppHero />
        {children}
        <InstallPrompt />
      </body>
    </html>
  )
}
