'use client'
import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  className?: string
  duration?: number
}

export function AnimatedCounter({ value, className, duration = 0.4 }: AnimatedCounterProps) {
  const count = useMotionValue(value)
  const rounded = useTransform(count, Math.round)
  const prevValue = useRef(value)

  useEffect(() => {
    const controls = animate(count, value, { duration, ease: 'easeOut' })
    prevValue.current = value
    return controls.stop
  }, [value, count, duration])

  return <motion.span className={className}>{rounded}</motion.span>
}
