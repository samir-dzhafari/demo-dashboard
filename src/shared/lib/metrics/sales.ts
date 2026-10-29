import type { VisitRecord } from '@/entities/record'
import type { Dataset } from '@/shared/api/mocks'
import { addDays, addMonths, daysInMonth, diffDays, splitByMonth } from '@/shared/lib/date'
import { capacityTotals, salesTotals } from './dailyIndex'
import { idPredicate, memoizeByDataset, percent, safeDivide, sliceByDate, type MetricFilters } from './filters'

const recordsInServiceRange = (dataset: Dataset, { from, to, branchIds, directionIds }: MetricFilters): VisitRecord[] => {
  const branchMatches = idPredicate(branchIds)
  const directionMatches = idPredicate(directionIds)
  return sliceByDate(dataset.records, from, to, (record) => record.slotDate).filter(
    (record) => branchMatches(record.branchId) && directionMatches(record.directionId),
  )
}

export const completedVisits = (dataset: Dataset, filters: MetricFilters): VisitRecord[] =>
  recordsInServiceRange(dataset, filters).filter((record) => record.status === 'completed')

/** Revenue = payments for visits completed in the period − refunds issued in the period. */
export const revenue = (dataset: Dataset, filters: MetricFilters): number => {
  const { paid, refunds } = salesTotals(dataset, filters)
  return paid - refunds
}

export const servicesCount = (dataset: Dataset, filters: MetricFilters): number => salesTotals(dataset, filters).completed

/** Average check = revenue ÷ services rendered. */
export const averageCheck = (dataset: Dataset, filters: MetricFilters): number | null =>
  safeDivide(revenue(dataset, filters), servicesCount(dataset, filters))

/** (canceled + no-show) ÷ all records of the period × 100. */
export const cancellationRate = (dataset: Dataset, filters: MetricFilters): number | null => {
  const { completed, records } = salesTotals(dataset, filters)
  return percent(records - completed, records)
}

/**
 * Capacity load = occupied slots ÷ available slots × 100.
 * A slot is occupied when a completed visit sits on it. Directions are ignored: slots have no direction.
 */
export const capacityLoad = (dataset: Dataset, filters: MetricFilters): number | null => {
  const { available, occupied } = capacityTotals(dataset, filters)
  return percent(occupied, available)
}

/** Plan revenue for the period; months covered only partly contribute proportionally to the days covered. */
export const planRevenue = (dataset: Dataset, { from, to, branchIds }: MetricFilters): number => {
  const branchMatches = idPredicate(branchIds)
  return splitByMonth({ from, to }).reduce((total, part) => {
    const share = daysCovered(part.from, part.to) / daysInMonth(part.month)
    const monthPlan = dataset.plans
      .filter((plan) => plan.month === part.month && branchMatches(plan.branchId))
      .reduce((sum, plan) => sum + plan.revenue, 0)
    return total + monthPlan * share
  }, 0)
}

const daysCovered = (from: string, to: string): number => diffDays(to, from) + 1

/** Plan completion = actual revenue ÷ plan revenue × 100. Directions are ignored: plans are per branch. */
export const planCompletion = (dataset: Dataset, filters: MetricFilters): number | null => {
  const withoutDirections: MetricFilters = { ...filters, directionIds: undefined }
  return percent(revenue(dataset, withoutDirections), planRevenue(dataset, withoutDirections))
}

/**
 * Share of clients with 2+ completed visits among all clients with a visit, within the 12 months ending at
 * `filters.to` (the period start is irrelevant by definition).
 */
export const repeatClientsShare = (dataset: Dataset, filters: MetricFilters): number | null => {
  const visitsPerClient = completedVisitsPerClient(dataset, filters)
  let repeat = 0
  visitsPerClient.forEach((count) => {
    if (count >= 2) repeat += 1
  })
  return percent(repeat, visitsPerClient.size)
}

export const completedVisitsPerClient = (dataset: Dataset, filters: MetricFilters): Map<number, number> => {
  const windowStart = trailingYearStart(filters.to)
  const counts = new Map<number, number>()
  completedVisits(dataset, { ...filters, from: windowStart }).forEach((record) => {
    counts.set(record.clientId, (counts.get(record.clientId) ?? 0) + 1)
  })
  return counts
}

const trailingYearStart = (to: string): string => addDays(addMonths(to, -12), 1)

/** Share of new bookings (by creation date) made through the site/widget, without an operator. */
export const onlineBookingShare = (dataset: Dataset, { from, to, branchIds, directionIds }: MetricFilters): number | null => {
  const branchMatches = idPredicate(branchIds)
  const directionMatches = idPredicate(directionIds)
  const inRange = sliceByDate(createdBookings(dataset), from, to, (record) => record.createdAt).filter(
    (record) => branchMatches(record.branchId) && directionMatches(record.directionId),
  )
  const online = inRange.filter((record) => record.bookingMethod === 'online').length
  return percent(online, inRange.length)
}

/** Records sorted by creation timestamp (the dataset itself is sorted by slot date). */
export const createdBookings = (dataset: Dataset): VisitRecord[] =>
  memoizeByDataset(dataset, 'records-by-created', () =>
    [...dataset.records].sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0)),
  )
