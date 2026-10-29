import type { Dataset } from '@/shared/api/mocks'
import { DATA_END, LEAD_LAG_DAYS } from '@/shared/api/mocks'
import { addDays, addMonths, endOfMonth, monthKey, startOfMonth, startOfWeek, type IsoDate, type MonthKey } from '@/shared/lib/date'
import { idPredicate, percent, safeDivide, sliceByDate, type MetricFilters } from './filters'
import { leadsCount, marketingBudget } from './marketing'
import { createdBookings } from './sales'

export const WEEKS_SHOWN = 16
export const MONTHS_SHOWN = 6

export interface WeeklyLeadsPoint {
  /** Monday of the week. */
  weekStart: IsoDate
  leads: number
  budget: number
  /** Budget ÷ leads of the week; null when the week has no leads. */
  cpl: number | null
}

/**
 * Leads and CPL for the last `weeks` complete Monday–Sunday weeks that end on or before the period end. Weeks that touch the
 * last days of the demo data are dropped (`LEAD_LAG_DAYS`): the generator censors leads there and the chart would end in a false dip.
 * The period start does not apply: the chart always shows a trend of the same length. Channel filter applies.
 */
export const leadsByWeek = (
  dataset: Dataset,
  { to, channelIds }: Pick<MetricFilters, 'to' | 'channelIds'>,
  weeks = WEEKS_SHOWN,
): WeeklyLeadsPoint[] => {
  const reliableEnd = addDays(DATA_END, -LEAD_LAG_DAYS)
  const end = to < reliableEnd ? to : reliableEnd
  let lastMonday = startOfWeek(end)
  if (addDays(lastMonday, 6) > end) lastMonday = addDays(lastMonday, -7)

  return Array.from({ length: weeks }, (_, index) => {
    const weekStart = addDays(lastMonday, (index - weeks + 1) * 7)
    const range = { from: weekStart, to: addDays(weekStart, 6), channelIds }
    const leads = leadsCount(dataset, range)
    const budget = marketingBudget(dataset, range)
    return { weekStart, leads, budget, cpl: safeDivide(budget, leads) }
  })
}

export interface BookingSourcesPoint {
  month: MonthKey
  online: number
  messenger: number
  phone: number
  total: number
  /** Online ÷ total × 100; null for a month without bookings. */
  onlineShare: number | null
}

/**
 * New bookings (by creation date) per month for the last `months` calendar months up to the month of the period end,
 * split by booking method. The last month is clipped to the period end. Branch and direction filters apply:
 * records have no channel, so the channel filter cannot.
 */
export const bookingSourcesByMonth = (
  dataset: Dataset,
  { to, branchIds, directionIds }: Pick<MetricFilters, 'to' | 'branchIds' | 'directionIds'>,
  months = MONTHS_SHOWN,
): BookingSourcesPoint[] => {
  const end = to < DATA_END ? to : DATA_END
  const branchMatches = idPredicate(branchIds)
  const directionMatches = idPredicate(directionIds)
  const bookings = createdBookings(dataset)

  return Array.from({ length: months }, (_, index) => {
    const from = startOfMonth(addMonths(end, index - months + 1))
    const monthEnd = endOfMonth(from)
    const counts = { online: 0, messenger: 0, phone: 0 }
    sliceByDate(bookings, from, monthEnd > end ? end : monthEnd, (record) => record.createdAt).forEach((record) => {
      if (branchMatches(record.branchId) && directionMatches(record.directionId)) counts[record.bookingMethod] += 1
    })
    const total = counts.online + counts.messenger + counts.phone
    return { month: monthKey(from), ...counts, total, onlineShare: percent(counts.online, total) }
  })
}
