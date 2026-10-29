import { useMemo } from 'react'
import { useMetricFilters } from '@/features/filters'
import { getDataset } from '@/shared/api/mocks'
import { branchPerformance } from '@/shared/lib/metrics'

export interface PlanFactRow {
  branchId: string
  name: string
  /** Million rubles. */
  revenue: number
  plan: number
  /** (fact − plan) ÷ plan × 100; null when the plan is zero. */
  deviation: number | null
  met: boolean
}

export interface BranchPlanFact {
  rows: PlanFactRow[]
  /** Scale of the bars, million rubles. */
  max: number
}

/**
 * Revenue and period plan per selected branch, sorted by revenue. Plans are per branch, not per direction,
 * so the direction cross-filter is dropped here and the bars show the whole branch revenue.
 */
export const useBranchPlanFact = (): BranchPlanFact => {
  const filters = useMetricFilters()
  return useMemo(() => {
    const dataset = getDataset()
    const rows = branchPerformance(dataset, { ...filters, directionIds: undefined }).map((stats): PlanFactRow => ({
      branchId: stats.branchId,
      name: dataset.branches.find((branch) => branch.id === stats.branchId)?.name ?? stats.branchId,
      revenue: stats.revenue / 1_000_000,
      plan: stats.planRevenue / 1_000_000,
      deviation: stats.planCompletion === null ? null : stats.planCompletion - 100,
      met: stats.planRevenue > 0 && stats.revenue >= stats.planRevenue,
    }))
    return { rows, max: Math.max(1, ...rows.flatMap((row) => [row.revenue, row.plan])) }
  }, [filters])
}
