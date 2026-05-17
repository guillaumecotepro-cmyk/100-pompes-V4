'use client'
import { forwardRef, ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-brand-500 text-white shadow-lg shadow-brand-200 hover:bg-brand-600 active:bg-brand-700',
  secondary: 'bg-white text-slate-800 border border-orange-100 hover:bg-orange-50 active:bg-orange-100',
  ghost:     'bg-transparent text-slate-600 hover:bg-orange-50 active:bg-orange-100',
  danger:    'bg-red-500 text-white shadow-lg shadow-red-100 hover:bg-red-600 active:bg-red-700',
}

const sizeClasses: Record<Size, string> = {
  sm:  'h-9  px-4  text-sm  rounded-lg',
  md:  'h-11 px-5  text-base rounded-xl',
  lg:  'h-14 px-6  text-lg  rounded-xl font-semibold',
  xl:  'h-16 px-8  text-xl  rounded-xl font-bold',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => (
    <motion.button
      ref={ref as React.Ref<HTMLButtonElement>}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150',
        'disabled:opacity-50 disabled:pointer-events-none select-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </motion.button>
  )
)
Button.displayName = 'Button'
