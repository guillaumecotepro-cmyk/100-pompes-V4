'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number // 0–100
  max?: number
  color?: string
  height?: 'sm' | 'md' | 'lg'
  className?: string
  animated?: boolean
  label?: string
}

const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }

export function Progress({
  value,
  max = 100,
  color = 'bg-brand-500',
  height = 'md',
  animated = true,
  label,
  className,
}: ProgressProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={className}>
      <div className={cn('w-full bg-gray-100 rounded-full overflow-hidden', heights[height])}>
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={animated ? { width: 0 } : { width: `${pct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      {label && <p className="text-xs text-gray-500 mt-1">{label}</p>}
    </div>
  )
}
