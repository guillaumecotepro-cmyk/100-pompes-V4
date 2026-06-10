import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg'
  elevated?: boolean
}

const paddings = { sm: 'p-3', md: 'p-4', lg: 'p-5' }

export function Card({ padding = 'md', elevated, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white/95 rounded-xl border border-orange-100',
        elevated ? 'shadow-xl shadow-orange-100/70' : 'shadow-sm shadow-orange-50',
        paddings[padding],
        className
      )}
      {...props}
    />
  )
}
