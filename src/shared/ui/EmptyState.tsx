import type { ReactNode } from 'react'
import { cn } from './cn'

interface EmptyStateProps {
  title?: string
  hint?: ReactNode
  className?: string
}

/** Placeholder for a widget whose filters leave no data. */
export const EmptyState = ({ title = 'Нет данных за выбранный период', hint = 'Измените период или фильтры', className }: EmptyStateProps) => (
  <div role="status" className={cn('flex h-full min-h-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-200 text-center', className)}>
    <p className="text-[13px] font-medium text-slate-600">{title}</p>
    {hint && <p className="text-xs text-slate-400">{hint}</p>}
  </div>
)
