'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, AlertTriangle, RefreshCw, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Navigation } from '@/components/Navigation'
import { useAppData } from '@/hooks/useWorkoutProgram'

export default function SettingsPage() {
  const router = useRouter()
  const { resetApp } = useAppData()
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  const handleReset = () => {
    resetApp()
    setResetDone(true)
    setTimeout(() => router.replace('/'), 1500)
  }

  return (
    <div className="app-page bg-gray-50">
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={22} className="text-gray-500" />
        </button>
        <h1 className="text-xl font-black text-gray-900">Paramètres</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-5">
        {/* About */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">À propos</p>
          <div className="flex flex-col gap-2">
            <Card>
              <div className="flex flex-col gap-1 text-sm text-gray-600">
                <p><span className="font-semibold text-gray-900">100 Pompes</span> <span className="text-brand-500 font-semibold">v1.0.0</span></p>
                <p className="text-xs text-gray-400 mt-1">Comptage par tap — touchez l'écran ou le bout du nez à chaque pompe.</p>
                <p className="text-xs text-gray-400">Données stockées localement. Aucune connexion requise.</p>
              </div>
            </Card>
            <Link href="/about">
              <Card className="flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                  <Info size={18} className="text-brand-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">En savoir +</p>
                  <p className="text-xs text-gray-500 mt-0.5">Fonctionnement complet de l'application</p>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </Card>
            </Link>
          </div>
        </div>

        {/* Danger zone */}
        <div>
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Zone de danger</p>
          {!confirmReset ? (
            <Card className="border-red-100">
              <p className="text-sm text-gray-600 mb-3">
                Réinitialiser toutes les données. Cette action est irréversible.
              </p>
              <Button variant="danger" size="md" fullWidth onClick={() => setConfirmReset(true)}>
                <AlertTriangle size={16} /> Réinitialiser l'application
              </Button>
            </Card>
          ) : resetDone ? (
            <Card className="text-center py-4">
              <p className="text-emerald-600 font-semibold">Données supprimées. Redirection...</p>
            </Card>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-red-200 bg-red-50">
                <p className="text-sm font-semibold text-red-800 mb-1">Tu es sûr(e) ?</p>
                <p className="text-xs text-red-700 mb-3">
                  Toutes tes séances, ton programme et tes statistiques seront perdus définitivement.
                </p>
                <div className="flex gap-3">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => setConfirmReset(false)}>
                    Annuler
                  </Button>
                  <Button variant="danger" size="sm" className="flex-1" onClick={handleReset}>
                    <RefreshCw size={14} /> Oui, réinitialiser
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  )
}
