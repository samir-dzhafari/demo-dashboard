import type { IsoDate } from '@/shared/lib/date'

/** Filters shared by all metrics. Empty or missing id lists mean "all". */
export interface MetricFilters {
  from: IsoDate
  to: IsoDate
  branchIds?: readonly string[]
  /** Service directions; affects revenue/visit metrics only (slots, plans and leads have no direction). */
  directionIds?: readonly string[]
  /** Marketing channels; affects lead/budget metrics only. */
  channelIds?: readonly string[]
}

export type IdPredicate = (id: string) => boolean

export const idPredicate = (ids: readonly string[] | undefined): IdPredicate => {
  if (!ids || ids.length === 0) return () => true
  const set = new Set(ids)
  return (id) => set.has(id)
}

/** First index whose key is >= `target` in an array sorted ascending by `getKey`. */
const lowerBound = <T>(items: readonly T[], target: string, getKey: (item: T) => string): number => {
  let low = 0
  let high = items.length
  while (low < high) {
    const mid = (low + high) >>> 1
    const item = items[mid] as T
    if (getKey(item) < target) low = mid + 1
    else high = mid
  }
  return low
}

/**
 * Items whose date key lies in [from, to]. `getKey` may return a date or a `YYYY-MM-DDTHH:mm` string:
 * the upper bound is compared as a prefix, so the whole last day is included.
 */
export const sliceByDate = <T>(items: readonly T[], from: IsoDate, to: IsoDate, getKey: (item: T) => string): T[] => {
  const start = lowerBound(items, from, getKey)
  const end = lowerBound(items, `${to}￿`, getKey)
  return items.slice(start, end)
}

export const safeDivide = (numerator: number, denominator: number): number | null =>
  denominator === 0 ? null : numerator / denominator

export const percent = (part: number, whole: number): number | null => {
  const ratio = safeDivide(part, whole)
  return ratio === null ? null : ratio * 100
}

const caches = new WeakMap<object, Map<string, unknown>>()

/** Memoizes expensive per-dataset indexes (the dataset is immutable). */
export const memoizeByDataset = <T>(dataset: object, key: string, build: () => T): T => {
  let perDataset = caches.get(dataset)
  if (!perDataset) {
    perDataset = new Map()
    caches.set(dataset, perDataset)
  }
  if (!perDataset.has(key)) perDataset.set(key, build())
  return perDataset.get(key) as T
}
