import { useMemo } from 'react'
import { useFilters, useMetricFilters } from '@/features/filters'
import { getDataset } from '@/shared/api/mocks'
import { previousYearRange } from '@/shared/lib/date'
import {
  computeDelta,
  computeMetric,
  planRevenue,
  sparklineSeries,
  type MetricKey,
  type SparklinePoint,
} from '@/shared/lib/metrics'
import type { SparklineTone } from '@/shared/ui'

export type KpiKey = Extract<MetricKey, 'revenue' | 'servicesCount' | 'averageCheck' | 'capacityLoad' | 'cancellationRate'>

export const CAPACITY_TARGET = 85

interface KpiDefinition {
  key: KpiKey
  title: string
  sparkTone: SparklineTone
}

const KPI_DEFINITIONS: readonly KpiDefinition[] = [
  { key: 'revenue', title: 'Выручка', sparkTone: 'blue' },
  { key: 'servicesCount', title: 'Оказано услуг', sparkTone: 'blue' },
  { key: 'averageCheck', title: 'Средний чек', sparkTone: 'blue' },
  { key: 'capacityLoad', title: 'Загрузка мощностей', sparkTone: 'green' },
  { key: 'cancellationRate', title: 'Отмены и неявки', sparkTone: 'green' },
]

export interface KpiView {
  key: KpiKey
  title: string
  value: number | null
  delta: number | null
  /** Muted text after the delta: "к 2025", "к плану", "к цели". */
  baseLabel: string
  spark: SparklinePoint[]
  sparkTone: SparklineTone
}

/** KPI values, deltas to the selected comparison base and sparklines for the current store filters. */
export const useKpiCards = (): KpiView[] => {
  const { filters: state } = useFilters()
  const filters = useMetricFilters()
  const { comparison } = state

  return useMemo(() => {
    const dataset = getDataset()
    const previousYear = String(Number(filters.to.slice(0, 4)) - 1)
    const previous = { ...filters, ...previousYearRange(filters) }
    // Plans exist per branch only, so a direction cross-filter leaves nothing to compare revenue with.
    const planAvailable = comparison === 'plan' && !filters.directionIds?.length

    return KPI_DEFINITIONS.map(({ key, title, sparkTone }): KpiView => {
      const value = computeMetric(dataset, key, filters)
      let base: number | null
      let baseLabel = `к ${previousYear}`
      if (planAvailable && key === 'revenue') {
        base = planRevenue(dataset, filters)
        baseLabel = 'к плану'
      } else if (planAvailable && key === 'capacityLoad') {
        base = CAPACITY_TARGET
        baseLabel = 'к цели'
      } else {
        // The spec defines no plan for the other metrics: they keep the year-over-year base.
        base = computeMetric(dataset, key, previous)
      }
      return { key, title, value, delta: computeDelta(key, value, base), baseLabel, spark: sparklineSeries(dataset, key, filters), sparkTone }
    })
  }, [filters, comparison])
}
