import { useMemo } from 'react'
import { useMetricFilters } from '@/features/filters'
import { DATA_END, getDataset } from '@/shared/api/mocks'
import { addDays } from '@/shared/lib/date'
import { capacityHeatmap, type HeatmapCell } from '@/shared/lib/metrics'

export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const

/** The heatmap always covers the last 8 full weeks of data, whatever period is selected (exception of the spec). */
export const HEATMAP_WEEKS = 8
export const HEATMAP_RANGE = { from: addDays(DATA_END, -(HEATMAP_WEEKS * 7 - 1)), to: DATA_END }

/** Load by weekday × hour over the last 8 weeks for the selected branches. */
export const useLoadHeatmap = (): HeatmapCell[][] => {
  const { branchIds } = useMetricFilters()
  return useMemo(() => capacityHeatmap(getDataset(), { ...HEATMAP_RANGE, branchIds }), [branchIds])
}
