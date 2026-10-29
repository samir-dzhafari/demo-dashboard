import type { Dataset } from '@/shared/api/mocks'
import { addDays, type IsoDate } from '@/shared/lib/date'
import { idPredicate, memoizeByDataset, type MetricFilters } from './filters'

/**
 * Prefix sums per (branch, direction) and per branch over calendar days. A metric over any date range then costs
 * a couple of array lookups per series instead of a scan over hundreds of thousands of records, which keeps
 * filter changes instant. Built once per dataset on first use.
 */
interface SalesSeries {
  branchId: string
  directionId: string
  /** Payments of completed visits by slot date. */
  paid: Float64Array
  /** Completed visits by slot date. */
  completed: Float64Array
  /** All records by slot date. */
  total: Float64Array
  /** Refund amounts by refund date. */
  refunds: Float64Array
}

interface CapacitySeries {
  branchId: string
  available: Float64Array
  occupied: Float64Array
}

interface DailyIndex {
  days: IsoDate[]
  sales: SalesSeries[]
  capacity: CapacitySeries[]
}

const prefix = (daily: Float64Array): Float64Array => {
  const sums = new Float64Array(daily.length + 1)
  for (let i = 0; i < daily.length; i += 1) sums[i + 1] = sums[i]! + daily[i]!
  return sums
}

const lowerBound = (days: readonly string[], target: string): number => {
  let low = 0
  let high = days.length
  while (low < high) {
    const mid = (low + high) >>> 1
    if ((days[mid] as string) < target) low = mid + 1
    else high = mid
  }
  return low
}

const buildIndex = (dataset: Dataset): DailyIndex => {
  let first = dataset.meta.from
  let last = dataset.meta.to
  const widen = (date: string | null) => {
    if (date === null) return
    if (date < first) first = date
    if (date > last) last = date
  }
  dataset.records.forEach((record) => {
    widen(record.slotDate)
    widen(record.refundDate)
  })
  dataset.slots.forEach((slot) => widen(slot.date))

  const days: IsoDate[] = []
  for (let day = first; day <= last; day = addDays(day, 1)) days.push(day)
  const position = new Map(days.map((day, index) => [day, index]))
  const size = days.length

  const salesDaily = new Map<string, Omit<SalesSeries, 'paid' | 'completed' | 'total' | 'refunds'> & Record<'paid' | 'completed' | 'total' | 'refunds', Float64Array>>()
  const salesOf = (branchId: string, directionId: string) => {
    const key = `${branchId}|${directionId}`
    let series = salesDaily.get(key)
    if (!series) {
      series = {
        branchId,
        directionId,
        paid: new Float64Array(size),
        completed: new Float64Array(size),
        total: new Float64Array(size),
        refunds: new Float64Array(size),
      }
      salesDaily.set(key, series)
    }
    return series
  }

  const capacityDaily = new Map<string, { branchId: string; available: Float64Array; occupied: Float64Array }>()
  const capacityOf = (branchId: string) => {
    let series = capacityDaily.get(branchId)
    if (!series) {
      series = { branchId, available: new Float64Array(size), occupied: new Float64Array(size) }
      capacityDaily.set(branchId, series)
    }
    return series
  }

  const occupiedSlots = new Set<number>()
  dataset.records.forEach((record) => {
    const series = salesOf(record.branchId, record.directionId)
    const day = position.get(record.slotDate)!
    series.total[day]! += 1
    if (record.status === 'completed') {
      series.completed[day]! += 1
      series.paid[day]! += record.amount
      if (!occupiedSlots.has(record.slotId)) {
        occupiedSlots.add(record.slotId)
        capacityOf(record.branchId).occupied[day]! += 1
      }
    }
    if (record.refundDate !== null) series.refunds[position.get(record.refundDate)!]! += record.refundAmount
  })
  dataset.slots.forEach((slot) => {
    if (slot.available) capacityOf(slot.branchId).available[position.get(slot.date)!]! += 1
  })

  return {
    days,
    sales: [...salesDaily.values()].map((series) => ({
      branchId: series.branchId,
      directionId: series.directionId,
      paid: prefix(series.paid),
      completed: prefix(series.completed),
      total: prefix(series.total),
      refunds: prefix(series.refunds),
    })),
    capacity: [...capacityDaily.values()].map((series) => ({
      branchId: series.branchId,
      available: prefix(series.available),
      occupied: prefix(series.occupied),
    })),
  }
}

const getIndex = (dataset: Dataset): DailyIndex => memoizeByDataset(dataset, 'daily-index', () => buildIndex(dataset))

/** Day positions of [from, to] as a half-open range of prefix-sum indexes. */
const rangeOf = (days: readonly string[], from: string, to: string): [number, number] => [lowerBound(days, from), lowerBound(days, `${to}￿`)]

export interface SalesTotals {
  /** Payments of completed visits by slot date. */
  paid: number
  /** Refunds by refund date. */
  refunds: number
  completed: number
  /** All records (completed, canceled and no-show) by slot date. */
  records: number
}

/** Sales totals for a range; branch and direction filters apply. */
export const salesTotals = (dataset: Dataset, { from, to, branchIds, directionIds }: MetricFilters): SalesTotals => {
  const index = getIndex(dataset)
  const [start, end] = rangeOf(index.days, from, to)
  const branchMatches = idPredicate(branchIds)
  const directionMatches = idPredicate(directionIds)
  const totals: SalesTotals = { paid: 0, refunds: 0, completed: 0, records: 0 }
  if (end <= start) return totals
  index.sales.forEach((series) => {
    if (!branchMatches(series.branchId) || !directionMatches(series.directionId)) return
    totals.paid += series.paid[end]! - series.paid[start]!
    totals.refunds += series.refunds[end]! - series.refunds[start]!
    totals.completed += series.completed[end]! - series.completed[start]!
    totals.records += series.total[end]! - series.total[start]!
  })
  return totals
}

/** Available and occupied slots for a range; only the branch filter applies. */
export const capacityTotals = (dataset: Dataset, { from, to, branchIds }: MetricFilters): { available: number; occupied: number } => {
  const index = getIndex(dataset)
  const [start, end] = rangeOf(index.days, from, to)
  const branchMatches = idPredicate(branchIds)
  const totals = { available: 0, occupied: 0 }
  if (end <= start) return totals
  index.capacity.forEach((series) => {
    if (!branchMatches(series.branchId)) return
    totals.available += series.available[end]! - series.available[start]!
    totals.occupied += series.occupied[end]! - series.occupied[start]!
  })
  return totals
}
