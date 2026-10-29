import { describe, expect, it } from 'vitest'
import type { Dataset } from '@/shared/api/mocks'
import type { Lead } from '@/entities/lead'
import type { VisitRecord } from '@/entities/record'
import {
  acquisitionFunnel,
  bookingConversion,
  channelEfficiency,
  costPerLead,
  customerAcquisitionCost,
  leadsCount,
  marketingBudget,
  romi,
} from './index'

/** Hand-made dataset: every expected number below can be checked on paper. */
const record = (id: number, clientId: number, status: VisitRecord['status'], amount: number, refundAmount = 0): VisitRecord => ({
  id,
  clientId,
  clientPhone: `+7${clientId}`,
  branchId: 'central',
  serviceId: 's',
  directionId: 'd',
  slotId: id,
  resourceId: 'r',
  slotDate: '2026-03-10',
  slotHour: 10,
  createdAt: '2026-03-05T10:00',
  status,
  amount,
  refundAmount,
  refundDate: null,
  bookingMethod: 'online',
})

const lead = (id: number, createdAt: string, phone: string, channelId: string, recordId: number | null): Lead => ({
  id,
  createdAt,
  phone,
  channelId,
  campaign: 'c',
  recordId,
})

const dataset = {
  meta: { seed: 0, from: '2026-03-01', to: '2026-03-31', updatedAt: '2026-03-31T23:00' },
  branches: [],
  directions: [],
  services: [],
  channels: [
    { id: 'ads', name: 'Реклама' },
    { id: 'seo', name: 'SEO' },
  ],
  resources: [],
  records: [
    record(1, 1, 'completed', 5000, 1000),
    record(2, 2, 'completed', 3000),
    record(3, 3, 'canceled', 0),
    record(4, 1, 'completed', 2000),
  ],
  slots: [],
  leads: [
    lead(1, '2026-03-01T09:00', 'p1', 'ads', 1),
    lead(2, '2026-03-02T09:00', 'p1', 'ads', null), // duplicate of lead 1 within 7 days: not counted
    lead(3, '2026-03-03T09:00', 'p2', 'ads', 2),
    lead(4, '2026-03-04T09:00', 'p3', 'seo', 3), // booking was canceled: counts as a booking, not as a new client
    lead(5, '2026-03-05T09:00', 'p4', 'seo', null),
    lead(6, '2026-03-20T09:00', 'p1', 'seo', null), // same phone, but 19 days after the first lead: counted
  ],
  marketingExpenses: [
    { date: '2026-03-01', channelId: 'ads', campaign: 'c', amount: 6000 },
    { date: '2026-03-15', channelId: 'ads', campaign: 'c', amount: 4000 },
    { date: '2026-03-15', channelId: 'seo', campaign: 'c', amount: 5000 },
  ],
  plans: [],
  webAnalytics: [
    { date: '2026-03-01', channelId: 'ads', visits: 400 },
    { date: '2026-03-01', channelId: 'seo', visits: 600 },
  ],
} satisfies Dataset

const march = { from: '2026-03-01', to: '2026-03-31' }

describe('marketing metrics on a hand-made dataset', () => {
  it('counts unique leads and skips a duplicate phone within 7 days', () => {
    expect(leadsCount(dataset, march)).toBe(5)
    expect(leadsCount(dataset, { ...march, channelIds: ['ads'] })).toBe(2)
    expect(leadsCount(dataset, { ...march, channelIds: ['seo'] })).toBe(3)
  })

  it('CPL = budget ÷ leads', () => {
    expect(marketingBudget(dataset, march)).toBe(15_000)
    expect(costPerLead(dataset, march)).toBe(3000)
    expect(costPerLead(dataset, { ...march, channelIds: ['ads'] })).toBe(5000)
  })

  it('booking conversion = leads with a booking ÷ leads', () => {
    expect(bookingConversion(dataset, march)).toBe(60)
    expect(bookingConversion(dataset, { ...march, channelIds: ['ads'] })).toBe(100)
  })

  it('CAC = budget ÷ new clients with a completed first visit', () => {
    // Leads 1 and 3 brought completed visits; lead 4 was canceled.
    expect(customerAcquisitionCost(dataset, march)).toBe(7500)
    expect(customerAcquisitionCost(dataset, { ...march, channelIds: ['seo'] })).toBeNull() // no new client from SEO
  })

  it('ROMI = (first-visit revenue − budget) ÷ budget, net of refunds', () => {
    // Revenue of first visits: (5000 − 1000) + 3000 = 7000 against 15 000 of budget.
    expect(romi(dataset, march)).toBeCloseTo(((7000 - 15_000) / 15_000) * 100, 8)
    // ADS only: budget 10 000, same revenue.
    expect(romi(dataset, { ...march, channelIds: ['ads'] })).toBeCloseTo(-30, 8)
  })

  it('returns null instead of NaN for a channel without budget', () => {
    expect(romi(dataset, { from: '2026-04-01', to: '2026-04-30' })).toBeNull()
    expect(costPerLead(dataset, { from: '2026-04-01', to: '2026-04-30' })).toBeNull()
  })

  it('channel rows and the total row agree', () => {
    const { rows, total } = channelEfficiency(dataset, march)
    expect(rows.map((row) => row.channelId)).toEqual(['ads', 'seo'])
    expect(rows.reduce((sum, row) => sum + row.leads, 0)).toBe(total.leads)
    expect(rows.reduce((sum, row) => sum + row.budget, 0)).toBe(total.budget)
  })

  it('filtering by a channel narrows the table, the funnel and the metrics together', () => {
    const only = { ...march, channelIds: ['seo'] }
    const { rows, total } = channelEfficiency(dataset, only)
    expect(rows).toHaveLength(1)
    expect(total.leads).toBe(3)
    const [visits, leads] = acquisitionFunnel(dataset, only)
    expect(visits?.count).toBe(600)
    expect(leads?.count).toBe(3)
  })
})
