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
        'bg-white rounded-2xl border border-gray-100',
        elevated ? 'shadow-lg shadow-gray-100' : 'shadow-sm',
        paddings[padding],
        className
      )}
      {...props}
    />
  )
}
