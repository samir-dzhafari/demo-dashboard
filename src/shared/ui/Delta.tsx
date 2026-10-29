import { formatDeltaPercent, formatPercentPoints } from '@/shared/lib/format'
import { METRIC_META, getDeltaTone, type MetricKey } from '@/shared/lib/metrics'
import { cn } from './cn'

interface DeltaProps {
  metric: MetricKey
  value: number
  /** `percent` → "+12,7%", `points` → "+1,1 п.п.". Defaults to the unit of the metric. */
  unit?: 'percent' | 'points'
  fractionDigits?: number
  /** Muted text after the value, e.g. "к 2025". */
  suffix?: string
  className?: string
}

const TONE_CLASS = { good: 'text-emerald-600', bad: 'text-red-500', neutral: 'text-slate-500' } as const

export const Delta = ({ metric, value, unit, fractionDigits = 1, suffix, className }: DeltaProps) => {
  const resolvedUnit = unit ?? (METRIC_META[metric].deltaKind === 'points' ? 'points' : 'percent')
  const tone = getDeltaTone(metric, value)
  // Strip the sign: the triangle already shows the direction.
  const text = (resolvedUnit === 'points' ? formatPercentPoints : formatDeltaPercent)(Math.abs(value), fractionDigits).replace(/^\+/, '')
  return (
    <span className={cn('inline-flex items-baseline gap-1 text-xs', className)}>
      <span className={cn('inline-flex items-baseline gap-1 font-semibold', TONE_CLASS[tone])}>
        <span aria-hidden className="text-[9px]">{value === 0 ? '' : value > 0 ? '▲' : '▼'}</span>
        {text}
      </span>
      {suffix && <span className="text-slate-500">{suffix}</span>}
    </span>
  )
}
