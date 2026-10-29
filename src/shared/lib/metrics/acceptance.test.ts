import { describe, expect, it } from 'vitest'
import { getDataset } from '@/shared/api/mocks'
import {
  acquisitionFunnel,
  averageCheck,
  branchPerformance,
  channelEfficiency,
  computeMetric,
  computeMetricSeries,
  costPerLead,
  customerAcquisitionCost,
  leadsCount,
  marketingBudget,
  revenue,
  revenueByDirection,
  romi,
  servicesCount,
  type MetricFilters,
} from './index'

const dataset = getDataset()

const PERIODS: Record<string, MetricFilters> = {
  'one month (Sep 2026)': { from: '2026-09-01', to: '2026-09-30' },
  'year to date': { from: '2026-01-01', to: '2026-10-28' },
  'arbitrary range': { from: '2025-03-17', to: '2026-02-09' },
}

describe.each(Object.entries(PERIODS))('acceptance criteria — %s', (_name, period) => {
  it('branch revenues add up to the network revenue', () => {
    const total = revenue(dataset, period)
    const sumOfBranches = dataset.branches.reduce((sum, branch) => sum + revenue(dataset, { ...period, branchIds: [branch.id] }), 0)
    expect(total).toBeGreaterThan(0)
    expect(sumOfBranches).toBe(total)

    const table = branchPerformance(dataset, period)
    expect(table).toHaveLength(7)
    expect(table.reduce((sum, row) => sum + row.revenue, 0)).toBe(total)
  })

  it('direction revenues add up to the network revenue', () => {
    const shares = revenueByDirection(dataset, period)
    expect(shares.reduce((sum, row) => sum + row.revenue, 0)).toBe(revenue(dataset, period))
    expect(shares.reduce((sum, row) => sum + (row.share ?? 0), 0)).toBeCloseTo(100, 6)
  })

  it('average check = revenue ÷ services, for the network and for a single branch', () => {
    const scopes: MetricFilters[] = [period, { ...period, branchIds: ['central'] }, { ...period, branchIds: ['river'] }]
    scopes.forEach((scope) => {
      const expected = revenue(dataset, scope) / servicesCount(dataset, scope)
      expect(averageCheck(dataset, scope)).toBeCloseTo(expected, 8)
    })
  })

  it('channel leads and budgets add up to the total row', () => {
    const { rows, total } = channelEfficiency(dataset, period)
    expect(rows).toHaveLength(6)
    expect(rows.reduce((sum, row) => sum + row.leads, 0)).toBe(total.leads)
    expect(rows.reduce((sum, row) => sum + row.budget, 0)).toBe(total.budget)
    expect(total.leads).toBe(leadsCount(dataset, period))
    expect(total.budget).toBe(marketingBudget(dataset, period))
    expect(rows.reduce((sum, row) => sum + row.newClients, 0)).toBe(total.newClients)
  })

  it('every funnel stage is not larger than the previous one', () => {
    const scopes: MetricFilters[] = [period, ...dataset.channels.map((channel) => ({ ...period, channelIds: [channel.id] }))]
    scopes.forEach((scope) => {
      const stages = acquisitionFunnel(dataset, scope)
      expect(stages.map((stage) => stage.key)).toEqual(['visits', 'leads', 'bookings', 'completed', 'repeat'])
      stages.forEach((stage, index) => {
        expect(stage.count).toBeGreaterThan(0)
        if (index > 0) expect(stage.count).toBeLessThanOrEqual((stages[index - 1] as { count: number }).count)
      })
    })
  })

  it('monthly series add up to the period value', () => {
    const series = computeMetricSeries(dataset, 'revenue', period)
    expect(series.reduce((sum, point) => sum + (point.value ?? 0), 0)).toBe(revenue(dataset, period))
    const leadSeries = computeMetricSeries(dataset, 'leads', period)
    expect(leadSeries.reduce((sum, point) => sum + (point.value ?? 0), 0)).toBeGreaterThan(0)
  })
})

describe('marketing metrics are recomputable from the raw fields', () => {
  const period: MetricFilters = { from: '2026-01-01', to: '2026-10-28' }

  const rawUniqueLeads = () => {
    const byPhone = new Map<string, typeof dataset.leads>()
    dataset.leads.forEach((lead) => byPhone.set(lead.phone, [...(byPhone.get(lead.phone) ?? []), lead]))
    const unique = new Set<number>()
    byPhone.forEach((leads) => {
      let lastCounted: number | null = null
      leads
        .slice()
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .forEach((lead) => {
          const time = Date.parse(`${lead.createdAt.slice(0, 10)}T00:00:00Z`)
          if (lastCounted === null || time - lastCounted >= 7 * 86_400_000) {
            lastCounted = time
            unique.add(lead.id)
          }
        })
    })
    return unique
  }

  it('CPL, CAC and ROMI match an independent calculation', () => {
    const unique = rawUniqueLeads()
    const recordsById = new Map(dataset.records.map((record) => [record.id, record]))

    const leadsInPeriod = dataset.leads.filter(
      (lead) => unique.has(lead.id) && lead.createdAt.slice(0, 10) >= period.from && lead.createdAt.slice(0, 10) <= period.to,
    )
    const budget = dataset.marketingExpenses
      .filter((expense) => expense.date >= period.from && expense.date <= period.to)
      .reduce((sum, expense) => sum + expense.amount, 0)

    const newClients = new Set<number>()
    let firstVisitRevenue = 0
    leadsInPeriod.forEach((lead) => {
      const record = lead.recordId === null ? undefined : recordsById.get(lead.recordId)
      if (record?.status === 'completed') {
        newClients.add(record.clientId)
        firstVisitRevenue += record.amount - record.refundAmount
      }
    })

    expect(leadsCount(dataset, period)).toBe(leadsInPeriod.length)
    expect(marketingBudget(dataset, period)).toBe(budget)
    expect(costPerLead(dataset, period)).toBeCloseTo(budget / leadsInPeriod.length, 8)
    expect(customerAcquisitionCost(dataset, period)).toBeCloseTo(budget / newClients.size, 8)
    expect(romi(dataset, period)).toBeCloseTo(((firstVisitRevenue - budget) / budget) * 100, 8)
  })

  it('per-channel CPL, CAC and ROMI follow the same formulas', () => {
    const { rows } = channelEfficiency(dataset, period)
    rows.forEach((row) => {
      expect(row.cpl).toBeCloseTo(row.budget / row.leads, 8)
      expect(row.cac).toBeCloseTo(row.budget / row.newClients, 8)
      const revenueOfNewClients = ((row.romi ?? 0) / 100 + 1) * row.budget
      expect(revenueOfNewClients).toBeGreaterThan(0)
    })
  })

  it('duplicate leads of one phone within 7 days are not counted', () => {
    const rawCount = dataset.leads.filter((lead) => lead.createdAt >= '2026-01-01' && lead.createdAt <= '2026-10-28T23:59').length
    expect(leadsCount(dataset, period)).toBeLessThan(rawCount)
    expect(leadsCount(dataset, period)).toBeGreaterThan(rawCount * 0.9)
  })
})

describe('metric registry', () => {
  it('computes every metric for the default period without failing', () => {
    const period: MetricFilters = { from: '2026-01-01', to: '2026-10-28' }
    const keys = [
      'revenue', 'servicesCount', 'averageCheck', 'capacityLoad', 'cancellationRate', 'planCompletion', 'leads',
      'bookingConversion', 'cpl', 'cac', 'romi', 'repeatClientsShare', 'onlineBookingShare',
    ] as const
    keys.forEach((key) => {
      const value = computeMetric(dataset, key, period)
      expect(value, key).not.toBeNull()
      expect(Number.isFinite(value as number), key).toBe(true)
    })
  })

  it('returns null instead of NaN when there is nothing to divide by', () => {
    const empty: MetricFilters = { from: '2030-01-01', to: '2030-01-31' }
    expect(computeMetric(dataset, 'averageCheck', empty)).toBeNull()
    expect(computeMetric(dataset, 'cpl', empty)).toBeNull()
    expect(computeMetric(dataset, 'capacityLoad', empty)).toBeNull()
  })
})
