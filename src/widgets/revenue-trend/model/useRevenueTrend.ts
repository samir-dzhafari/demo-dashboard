import { useMemo } from 'react'
import { useMetricFilters } from '@/features/filters'
import { DATA_END, getDataset } from '@/shared/api/mocks'
import { endOfMonth, shiftYear } from '@/shared/lib/date'
import { planRevenue, revenue } from '@/shared/lib/metrics'

export const MONTH_LABELS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'] as const

export interface RevenueTrendPoint {
  month: string
  /** Million rubles; null for months after the end of the period (the line breaks). */
  fact: number | null
  previousYear: number
  /** Null when a service-direction filter is active: plans are not split by direction. */
  plan: number | null
}

export interface RevenueTrend {
  year: number
  points: RevenueTrendPoint[]
  hasPlan: boolean
}

const MILLION = 1_000_000

/**
 * 12 months of the year in which the period ends. The fact runs until the end of the period (or of the data);
 * the previous year and the plan cover whole months, except the last fact month when it is incomplete: there they are
 * cut to the same days, so a partial month is compared like for like. Branch and direction filters apply, the period start does not.
 */
export const useRevenueTrend = (): RevenueTrend => {
  const filters = useMetricFilters()
  return useMemo(() => {
    const dataset = getDataset()
    const year = Number(filters.to.slice(0, 4))
    const factEnd = filters.to < DATA_END ? filters.to : DATA_END
    const hasPlan = !filters.directionIds?.length
    const scope = { branchIds: filters.branchIds, directionIds: filters.directionIds }

    const points = MONTH_LABELS.map((month, index): RevenueTrendPoint => {
      const from = `${year}-${String(index + 1).padStart(2, '0')}-01`
      const to = endOfMonth(from)
      const hasFact = from <= factEnd
      const comparableTo = hasFact && factEnd < to ? factEnd : to
      return {
        month,
        fact: hasFact ? revenue(dataset, { ...scope, from, to: comparableTo }) / MILLION : null,
        previousYear: revenue(dataset, { ...scope, from: shiftYear(from, -1), to: shiftYear(comparableTo, -1) }) / MILLION,
        plan: hasPlan ? planRevenue(dataset, { from, to: comparableTo, branchIds: filters.branchIds }) / MILLION : null,
      }
    })
    return { year, points, hasPlan }
  }, [filters])
}
