'use client'
import { motion } from 'framer-motion'

interface TapZoneProps {
  children: React.ReactNode
  onTap: () => void
  pulseKey?: number
  className?: string
}

export function TapZone({ children, onTap, pulseKey = 0, className = '' }: TapZoneProps) {
  return (
    <motion.button
      key={pulseKey}
      animate={pulseKey > 0 ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.22 }}
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      className={`relative w-full rounded-3xl bg-brand-500 text-white shadow-2xl shadow-brand-300 select-none cursor-pointer flex flex-col items-center justify-center ${className}`}
      style={{ height: '80dvh' }}
    >
      {children}
    </motion.button>
  )
}
