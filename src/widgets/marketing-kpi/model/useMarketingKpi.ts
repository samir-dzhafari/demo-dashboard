import { useMemo } from 'react'
import { useMetricFilters } from '@/features/filters'
import { getDataset } from '@/shared/api/mocks'
import { previousYearRange } from '@/shared/lib/date'
import { computeDelta, computeMetric, sparklineSeries, type MetricKey, type SparklinePoint } from '@/shared/lib/metrics'
import type { SparklineTone } from '@/shared/ui'

export type MarketingKpiKey = Extract<MetricKey, 'leads' | 'bookingConversion' | 'cpl' | 'cac' | 'romi'>

interface Definition {
  key: MarketingKpiKey
  title: string
  /** Formula shown in the tooltip. */
  hint: string
  sparkTone: SparklineTone
}

const DEFINITIONS: readonly Definition[] = [
  { key: 'leads', title: 'Лиды', hint: 'Уникальные заявки; дубль телефона за 7 дней не считается', sparkTone: 'blue' },
  { key: 'bookingConversion', title: 'Конверсия в запись', hint: 'Лиды с записью ÷ лиды', sparkTone: 'blue' },
  { key: 'cpl', title: 'Стоимость лида (CPL)', hint: 'Бюджет ÷ лиды. Снижение — хорошо', sparkTone: 'green' },
  { key: 'cac', title: 'CAC', hint: 'Бюджет ÷ новые клиенты с визитом «Состоялась». Снижение — хорошо', sparkTone: 'green' },
  { key: 'romi', title: 'ROMI', hint: '(Выручка первого визита − бюджет) ÷ бюджет', sparkTone: 'blue' },
]

export interface MarketingKpiView {
  key: MarketingKpiKey
  title: string
  hint: string
  value: number | null
  delta: number | null
  baseLabel: string
  spark: SparklinePoint[]
  sparkTone: SparklineTone
}

/** Marketing KPIs for the store filters. Plans exist only for revenue, so the base is always the same period a year earlier. */
export const useMarketingKpi = (): MarketingKpiView[] => {
  const filters = useMetricFilters()
  return useMemo(() => {
    const dataset = getDataset()
    const previous = { ...filters, ...previousYearRange(filters) }
    const baseLabel = `к ${Number(filters.to.slice(0, 4)) - 1}`
    return DEFINITIONS.map(({ key, ...rest }): MarketingKpiView => {
      const value = computeMetric(dataset, key, filters)
      const delta = computeDelta(key, value, computeMetric(dataset, key, previous))
      return { key, ...rest, value, delta, baseLabel, spark: sparklineSeries(dataset, key, filters) }
    })
  }, [filters])
}
