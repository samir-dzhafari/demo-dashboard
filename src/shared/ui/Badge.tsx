import type { ReactNode } from 'react'
import { cn } from './cn'

export type BadgeTone = 'green' | 'yellow' | 'red' | 'blue' | 'neutral'

const TONES: Record<BadgeTone, string> = {
  green: 'bg-emerald-50 text-emerald-700',
  yellow: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-600',
  blue: 'bg-blue-50 text-blue-700',
  neutral: 'bg-slate-100 text-slate-600',
}

interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}

export const Badge = ({ tone = 'neutral', children, className }: BadgeProps) => (
  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium leading-4', TONES[tone], className)}>
    {children}
  </span>
)
