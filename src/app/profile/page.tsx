'use client'
import { ChangeEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Camera, User, Settings, ChevronRight, Award, BarChart2, History, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Navigation } from '@/components/Navigation'
import { useAppData } from '@/hooks/useWorkoutProgram'
import { getLevelLabel, getLevelBadgeClass, formatDate } from '@/lib/utils'
import { ALL_BADGES } from '@/lib/programGenerator'

export default function ProfilePage() {
  const { data, updateAvatarImage } = useAppData()
  const { profile, stats, earnedBadges } = data
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const size = 320
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const scale = Math.max(size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
        updateAvatarImage(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  if (!profile) return null

  const allBadges = ALL_BADGES.map(b => ({
    ...b,
    earned: earnedBadges.includes(b.id),
  }))

  return (
    <div className="app-page bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-md overflow-hidden"
              style={{ backgroundColor: profile.avatarColor }}
            >
              {profile.avatarImage ? (
                <img src={profile.avatarImage} alt="" className="w-full h-full object-cover" />
              ) : (
                profile.name[0].toUpperCase()
              )}
            </div>
            {/* Photo edit button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-md"
              aria-label="Modifier la photo"
            >
              <Camera size={12} />
            </button>
            {profile.avatarImage && (
              <button
                onClick={() => updateAvatarImage(null)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-500 text-white flex items-center justify-center shadow"
                aria-label="Retirer la photo"
              >
                <X size={10} />
              </button>
            )}
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">{profile.name}</h1>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getLevelBadgeClass(profile.level)}`}>
              {getLevelLabel(profile.level)}
            </span>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-400">
          Membre depuis {formatDate(profile.createdAt)} · Test initial : {profile.initialTestScore} pompes
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Séances',  value: stats.totalSessions },
            { label: 'Total',    value: stats.totalPushups.toLocaleString('fr') },
            { label: 'Record',   value: stats.bestSingleSet },
          ].map(({ label, value }) => (
            <Card key={label} className="text-center">
              <p className="text-xl font-black text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </Card>
          ))}
        </div>

        {/* Badges */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Award size={16} className="text-amber-500" /> Badges
            </p>
            <span className="text-xs text-gray-400">{earnedBadges.length} / {ALL_BADGES.length}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {allBadges.map(b => (
              <motion.div
                key={b.id}
                whileTap={{ scale: 0.93 }}
                className={`flex flex-col items-center p-2 rounded-xl text-center transition-opacity ${b.earned ? 'opacity-100' : 'opacity-30 grayscale'}`}
                title={b.description}
              >
                <span className="text-2xl">{b.icon}</span>
                <p className="text-[9px] text-gray-600 mt-1 leading-tight">{b.name}</p>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Navigation links */}
        {[
          { href: '/history',  Icon: History,  label: 'Historique des séances' },
          { href: '/progress', Icon: BarChart2, label: 'Progression détaillée' },
          { href: '/settings', Icon: Settings,  label: 'Paramètres' },
        ].map(({ href, Icon, label }) => (
          <Link key={href} href={href}>
            <Card className="flex items-center gap-3 py-3.5 hover:bg-gray-50 transition-colors">
              <Icon size={18} className="text-gray-400" />
              <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
              <ChevronRight size={16} className="text-gray-300" />
            </Card>
          </Link>
        ))}
      </div>
      <Navigation />
    </div>
  )
}
