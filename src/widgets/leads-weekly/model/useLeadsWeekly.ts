import { useMemo } from 'react'
import { useMetricFilters } from '@/features/filters'
import { getDataset } from '@/shared/api/mocks'
import { formatDayMonth } from '@/shared/lib/format'
import { leadsByWeek, type WeeklyLeadsPoint } from '@/shared/lib/metrics'

export interface WeeklyPoint extends WeeklyLeadsPoint {
  /** Axis label: date of the Monday, dd.mm. */
  label: string
}

/** Last 16 complete weeks before the period end; only the channel filter and the period end apply. */
export const useLeadsWeekly = (): WeeklyPoint[] => {
  const { to, channelIds } = useMetricFilters()
  return useMemo(
    () => leadsByWeek(getDataset(), { to, channelIds }).map((point) => ({ ...point, label: formatDayMonth(point.weekStart) })),
    [to, channelIds],
  )
}
