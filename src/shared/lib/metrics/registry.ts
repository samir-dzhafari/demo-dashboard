import type { Dataset } from '@/shared/api/mocks'
import { addDays, diffDays, previousYearRange, splitByMonth } from '@/shared/lib/date'
import { formatDayMonth, monthShort } from '@/shared/lib/format'
import type { MetricFilters } from './filters'
import { byMonth, type MonthlyPoint } from './breakdowns'
import { bookingConversion, costPerLead, customerAcquisitionCost, leadsCount, romi } from './marketing'
import { computeDelta, getDeltaTone, type DeltaTone, type MetricKey } from './metricMeta'
import {
  averageCheck,
  cancellationRate,
  capacityLoad,
  onlineBookingShare,
  planCompletion,
  repeatClientsShare,
  revenue,
  servicesCount,
} from './sales'

type MetricFunction = (dataset: Dataset, filters: MetricFilters) => number | null

export const METRIC_FUNCTIONS: Record<MetricKey, MetricFunction> = {
  revenue,
  servicesCount,
  averageCheck,
  capacityLoad,
  cancellationRate,
  planCompletion,
  leads: leadsCount,
  bookingConversion,
  cpl: costPerLead,
  cac: customerAcquisitionCost,
  romi,
  repeatClientsShare,
  onlineBookingShare,
}

export const computeMetric = (dataset: Dataset, key: MetricKey, filters: MetricFilters): number | null =>
  METRIC_FUNCTIONS[key](dataset, filters)

/** Metric value per calendar month of the period: the data of a KPI card sparkline. */
export const computeMetricSeries = (
  dataset: Dataset,
  key: MetricKey,
  filters: MetricFilters,
): Array<MonthlyPoint<number | null>> => byMonth(filters, (monthFilters) => computeMetric(dataset, key, monthFilters))

export interface MetricComparison {
  key: MetricKey
  value: number | null
  base: number | null
  /** Relative % for money/count metrics, percentage points for ratio metrics (see `METRIC_META`). */
  delta: number | null
  tone: DeltaTone | null
}

/** Value for the period against the same period one year earlier. */
export const compareWithPreviousYear = (dataset: Dataset, key: MetricKey, filters: MetricFilters): MetricComparison => {
  const value = computeMetric(dataset, key, filters)
  const base = computeMetric(dataset, key, { ...filters, ...previousYearRange(filters) })
  const delta = computeDelta(key, value, base)
  return { key, value, base, delta, tone: delta === null ? null : getDeltaTone(key, delta) }
}

export interface SparklinePoint {
  /** Tooltip caption: a month ("Окт 2026") or a week ("12.10 – 18.10"). */
  label: string
  value: number
}

/** Sparkline points: months of the period, or weeks when the period is too short for a readable monthly line. */
export const sparklineSeries = (dataset: Dataset, key: MetricKey, filters: MetricFilters): SparklinePoint[] => {
  if (splitByMonth(filters).length >= 4) {
    return computeMetricSeries(dataset, key, filters).map((point) => ({
      label: `${monthShort(point.month)} ${point.month.slice(0, 4)}`,
      value: point.value ?? 0,
    }))
  }

  const days = diffDays(filters.to, filters.from) + 1
  const weeks = Math.max(2, Math.ceil(days / 7))
  const points: SparklinePoint[] = []
  for (let index = 0; index < weeks; index += 1) {
    const from = addDays(filters.from, index * 7)
    const to = addDays(from, 6) > filters.to ? filters.to : addDays(from, 6)
    if (from <= to) {
      points.push({ label: `${formatDayMonth(from)} – ${formatDayMonth(to)}`, value: computeMetric(dataset, key, { ...filters, from, to }) ?? 0 })
    }
  }
  return points
}
