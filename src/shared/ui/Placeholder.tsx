import { Card } from './Card'
import { cn } from './cn'

interface PlaceholderProps {
  title: string
  className?: string
}

/** Stand-in for a widget that lands in a later session. */
export const Placeholder = ({ title, className }: PlaceholderProps) => (
  <Card title={title} className={cn('min-h-0', className)} contentClassName="flex items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
    TODO: виджет
  </Card>
)
