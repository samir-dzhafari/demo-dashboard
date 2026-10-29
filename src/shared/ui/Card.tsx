import type { ReactNode } from 'react'
import { cn } from './cn'

interface CardProps {
  title?: ReactNode
  subtitle?: ReactNode
  /** Slot in the top-right corner of the header (legend, button, select). */
  action?: ReactNode
  children?: ReactNode
  className?: string
  contentClassName?: string
}

export const Card = ({ title, subtitle, action, children, className, contentClassName }: CardProps) => (
  <section className={cn('flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)]', className)}>
    {(title || action) && (
      <header className="mb-3 flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          {title && <h2 className="text-[15px] font-semibold leading-5 text-slate-900">{title}</h2>}
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
    )}
    <div className={cn('min-h-0 flex-1', contentClassName)}>{children}</div>
  </section>
)
