export type MetricKey =
  | 'revenue'
  | 'servicesCount'
  | 'averageCheck'
  | 'capacityLoad'
  | 'cancellationRate'
  | 'planCompletion'
  | 'leads'
  | 'bookingConversion'
  | 'cpl'
  | 'cac'
  | 'romi'
  | 'repeatClientsShare'
  | 'onlineBookingShare'

interface MetricMeta {
  /** Which direction of change is an improvement. */
  better: 'higher' | 'lower'
  /** How a comparison delta is expressed: relative % of the base value, or percentage points. */
  deltaKind: 'relative' | 'points'
}

export const METRIC_META: Record<MetricKey, MetricMeta> = {
  revenue: { better: 'higher', deltaKind: 'relative' },
  servicesCount: { better: 'higher', deltaKind: 'relative' },
  averageCheck: { better: 'higher', deltaKind: 'relative' },
  capacityLoad: { better: 'higher', deltaKind: 'points' },
  cancellationRate: { better: 'lower', deltaKind: 'points' },
  planCompletion: { better: 'higher', deltaKind: 'points' },
  leads: { better: 'higher', deltaKind: 'relative' },
  bookingConversion: { better: 'higher', deltaKind: 'points' },
  cpl: { better: 'lower', deltaKind: 'relative' },
  cac: { better: 'lower', deltaKind: 'relative' },
  romi: { better: 'higher', deltaKind: 'points' },
  repeatClientsShare: { better: 'higher', deltaKind: 'points' },
  onlineBookingShare: { better: 'higher', deltaKind: 'points' },
}

export type DeltaTone = 'good' | 'bad' | 'neutral'

export const getDeltaTone = (metricKey: MetricKey, delta: number): DeltaTone => {
  if (delta === 0) return 'neutral'
  const isIncrease = delta > 0
  return isIncrease === (METRIC_META[metricKey].better === 'higher') ? 'good' : 'bad'
}

/** Green when true. For "bad" metrics (cancellations, CPL, CAC) a decrease is good. Zero delta is not good. */
export const isGoodDelta = (metricKey: MetricKey, delta: number): boolean => getDeltaTone(metricKey, delta) === 'good'

/** Delta between two metric values in the unit appropriate for the metric (% or п.п.). Null if not computable. */
export const computeDelta = (metricKey: MetricKey, current: number | null, base: number | null): number | null => {
  if (current === null || base === null) return null
  if (METRIC_META[metricKey].deltaKind === 'points') return current - base
  return base === 0 ? null : ((current - base) / base) * 100
}
