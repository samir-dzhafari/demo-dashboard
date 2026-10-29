import type { Dataset } from '@/shared/api/mocks'
import { FIRST_HOUR, LAST_HOUR } from '@/shared/api/mocks'
import { splitByMonth, weekdayIndex } from '@/shared/lib/date'
import type { MetricFilters } from './filters'
import { idPredicate, percent, sliceByDate } from './filters'
import {
  averageCheck,
  cancellationRate,
  capacityLoad,
  planCompletion,
  planRevenue,
  revenue,
  servicesCount,
} from './sales'

export interface BranchStats {
  branchId: string
  revenue: number
  servicesCount: number
  averageCheck: number | null
  capacityLoad: number | null
  cancellationRate: number | null
  planRevenue: number
  /** Actual ÷ plan × 100. */
  planCompletion: number | null
}

/** One row per selected branch, sorted by revenue descending. */
export const branchPerformance = (dataset: Dataset, filters: MetricFilters): BranchStats[] => {
  const branchMatches = idPredicate(filters.branchIds)
  return dataset.branches
    .filter((branch) => branchMatches(branch.id))
    .map((branch) => {
      const branchFilters = { ...filters, branchIds: [branch.id] }
      return {
        branchId: branch.id,
        revenue: revenue(dataset, branchFilters),
        servicesCount: servicesCount(dataset, branchFilters),
        averageCheck: averageCheck(dataset, branchFilters),
        capacityLoad: capacityLoad(dataset, branchFilters),
        cancellationRate: cancellationRate(dataset, branchFilters),
        planRevenue: planRevenue(dataset, branchFilters),
        planCompletion: planCompletion(dataset, branchFilters),
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
}

export interface DirectionShare {
  directionId: string
  revenue: number
  /** Share of total revenue, %. */
  share: number | null
}

/** Revenue structure by service direction. Ignores `filters.directionIds` so all slices stay visible. */
export const revenueByDirection = (dataset: Dataset, filters: MetricFilters): DirectionShare[] => {
  const withoutDirections = { ...filters, directionIds: undefined }
  const rows = dataset.directions.map((direction) => ({
    directionId: direction.id,
    revenue: revenue(dataset, { ...withoutDirections, directionIds: [direction.id] }),
  }))
  const total = rows.reduce((sum, row) => sum + row.revenue, 0)
  return rows.map((row) => ({ ...row, share: percent(row.revenue, total) }))
}

export interface MonthlyPoint<T> {
  month: string
  value: T
}

/** Evaluates `compute` for every calendar month of the period (months are clipped to the period). */
export const byMonth = <T>(filters: MetricFilters, compute: (monthFilters: MetricFilters) => T): Array<MonthlyPoint<T>> =>
  splitByMonth(filters).map((part) => ({ month: part.month, value: compute({ ...filters, from: part.from, to: part.to }) }))

export interface HeatmapCell {
  /** Monday = 0 … Sunday = 6. */
  weekday: number
  /** Start hour of the slot. */
  hour: number
  /** Occupied ÷ available slots, %; null when no slot was available. */
  load: number | null
}

/**
 * Capacity load by weekday × hour (rows Monday…Sunday, columns `FIRST_HOUR`…`LAST_HOUR`). Same definition as
 * `capacityLoad`: a slot is occupied when a completed visit sits on it. Only `from`, `to` and `branchIds` apply.
 */
export const capacityHeatmap = (dataset: Dataset, { from, to, branchIds }: MetricFilters): HeatmapCell[][] => {
  const branchMatches = idPredicate(branchIds)
  const hours = LAST_HOUR - FIRST_HOUR + 1
  const available = Array.from({ length: 7 }, () => new Array<number>(hours).fill(0))
  const occupied = Array.from({ length: 7 }, () => new Array<number>(hours).fill(0))
  const weekdays = new Map<string, number>()
  const weekdayOf = (date: string): number => {
    let index = weekdays.get(date)
    if (index === undefined) {
      index = weekdayIndex(date)
      weekdays.set(date, index)
    }
    return index
  }

  sliceByDate(dataset.slots, from, to, (slot) => slot.date).forEach((slot) => {
    if (slot.available && branchMatches(slot.branchId)) available[weekdayOf(slot.date)]![slot.hour - FIRST_HOUR]! += 1
  })
  const seen = new Set<number>()
  sliceByDate(dataset.records, from, to, (record) => record.slotDate).forEach((record) => {
    if (record.status !== 'completed' || !branchMatches(record.branchId) || seen.has(record.slotId)) return
    seen.add(record.slotId)
    occupied[weekdayOf(record.slotDate)]![record.slotHour - FIRST_HOUR]! += 1
  })

  return available.map((row, weekday) =>
    row.map((count, offset) => ({ weekday, hour: FIRST_HOUR + offset, load: percent(occupied[weekday]![offset]!, count) })),
  )
}
