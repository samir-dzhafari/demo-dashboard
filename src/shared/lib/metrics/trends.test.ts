import { describe, expect, it } from 'vitest'
import { DATA_END, LEAD_LAG_DAYS, getDataset } from '@/shared/api/mocks'
import { addDays, weekdayIndex } from '@/shared/lib/date'
import { bookingSourcesByMonth, costPerLead, leadsByWeek, leadsCount, marketingBudget, WEEKS_SHOWN } from './index'

const dataset = getDataset()

describe('leadsByWeek', () => {
  const weeks = leadsByWeek(dataset, { to: DATA_END })

  it('returns 16 consecutive Mondays that end before the censored tail of the data', () => {
    expect(weeks).toHaveLength(WEEKS_SHOWN)
    weeks.forEach((week, index) => {
      expect(weekdayIndex(week.weekStart)).toBe(0)
      if (index > 0) expect(week.weekStart).toBe(addDays(weeks[index - 1]!.weekStart, 7))
    })
    expect(addDays(weeks[weeks.length - 1]!.weekStart, 6) <= addDays(DATA_END, -LEAD_LAG_DAYS)).toBe(true)
  })

  it('leads and budget of the weeks add up to the same range computed at once', () => {
    const range = { from: weeks[0]!.weekStart, to: addDays(weeks[weeks.length - 1]!.weekStart, 6) }
    expect(weeks.reduce((sum, week) => sum + week.leads, 0)).toBe(leadsCount(dataset, range))
    expect(weeks.reduce((sum, week) => sum + week.budget, 0)).toBe(marketingBudget(dataset, range))
  })

  it('CPL of a week is its budget ÷ leads', () => {
    weeks.forEach((week) => expect(week.cpl).toBeCloseTo(week.budget / week.leads, 8))
    const first = weeks[0]!
    expect(first.cpl).toBe(costPerLead(dataset, { from: first.weekStart, to: addDays(first.weekStart, 6) }))
  })

  it('follows the channel filter and the period end', () => {
    const ads = leadsByWeek(dataset, { to: DATA_END, channelIds: ['ads'] })
    expect(ads[0]!.leads).toBeLessThan(weeks[0]!.leads)
    const earlier = leadsByWeek(dataset, { to: '2026-06-30' })
    expect(earlier[earlier.length - 1]!.weekStart < weeks[0]!.weekStart).toBe(true)
  })
})

describe('bookingSourcesByMonth', () => {
  const months = bookingSourcesByMonth(dataset, { to: DATA_END })

  it('covers the 6 last months and splits bookings by method', () => {
    expect(months.map((point) => point.month)).toEqual(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'])
    months.forEach((point) => {
      expect(point.online + point.messenger + point.phone).toBe(point.total)
      expect(point.onlineShare).toBeCloseTo((point.online / point.total) * 100, 8)
    })
  })

  it('respects the branch filter', () => {
    const central = bookingSourcesByMonth(dataset, { to: DATA_END, branchIds: ['central'] })
    central.forEach((point, index) => expect(point.total).toBeLessThan(months[index]!.total))
  })

  it('crosses a year boundary', () => {
    const early = bookingSourcesByMonth(dataset, { to: '2026-02-28' })
    expect(early.map((point) => point.month)).toEqual(['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02'])
  })
})
