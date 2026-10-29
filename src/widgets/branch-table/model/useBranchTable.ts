import { useMemo } from 'react'
import { useMetricFilters } from '@/features/filters'
import { getDataset } from '@/shared/api/mocks'
import { branchPerformance, type BranchStats } from '@/shared/lib/metrics'

export interface BranchRow extends BranchStats {
  name: string
}

/** Per-branch indicators for the selected period; all store filters apply (plan completion ignores directions). */
export const useBranchTable = (): BranchRow[] => {
  const filters = useMetricFilters()
  return useMemo(() => {
    const dataset = getDataset()
    return branchPerformance(dataset, filters).map((stats) => ({
      ...stats,
      name: dataset.branches.find((branch) => branch.id === stats.branchId)?.name ?? stats.branchId,
    }))
  }, [filters])
}
