import { useMemo } from 'react'
import { useMetricFilters } from '@/features/filters'
import { getDataset } from '@/shared/api/mocks'
import { previousYearRange } from '@/shared/lib/date'
import { revenueByDirection } from '@/shared/lib/metrics'

/** Directions that make up the "packages and corporate segment" share of the spec. */
const SEGMENT_DIRECTION_IDS = ['packages', 'corporate'] as const

/** Colors in the order of the direction directory. */
export const DIRECTION_COLORS = ['#2F5BEA', '#12B5A0', '#7C5CE6', '#F59E0B', '#B8C0D4'] as const

export interface StructureSlice {
  id: string
  name: string
  revenue: number
  /** Share of total revenue, %. */
  share: number
  color: string
}

export interface RevenueStructure {
  slices: StructureSlice[]
  total: number
  /** Packages + corporate share of revenue, % (null when there is no revenue). */
  segmentShare: number | null
  /** Change of that share against the same period of the previous year, п.п. */
  segmentDelta: number | null
}

const segmentShareOf = (rows: ReturnType<typeof revenueByDirection>): number | null => {
  const total = rows.reduce((sum, row) => sum + row.revenue, 0)
  if (total === 0) return null
  const segment = rows.filter((row) => (SEGMENT_DIRECTION_IDS as readonly string[]).includes(row.directionId))
  return (segment.reduce((sum, row) => sum + row.revenue, 0) / total) * 100
}

/** Revenue by service direction for the period and branches in the store (the direction filter itself is ignored). */
export const useRevenueStructure = (): RevenueStructure => {
  const filters = useMetricFilters()
  return useMemo(() => {
    const dataset = getDataset()
    const rows = revenueByDirection(dataset, filters)
    const total = rows.reduce((sum, row) => sum + row.revenue, 0)
    const slices = rows.map((row, index): StructureSlice => ({
      id: row.directionId,
      name: dataset.directions.find((direction) => direction.id === row.directionId)?.name ?? row.directionId,
      revenue: row.revenue,
      share: row.share ?? 0,
      color: DIRECTION_COLORS[index % DIRECTION_COLORS.length] as string,
    }))
    const segmentShare = segmentShareOf(rows)
    const previousShare = segmentShareOf(revenueByDirection(dataset, { ...filters, ...previousYearRange(filters) }))
    const segmentDelta = segmentShare === null || previousShare === null ? null : segmentShare - previousShare
    return { slices, total, segmentShare, segmentDelta }
  }, [filters])
}
