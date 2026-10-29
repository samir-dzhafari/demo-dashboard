import { describe, expect, it } from 'vitest'
import { generateDataset, getDataset } from './index'
import { revenue, capacityLoad, cancellationRate, onlineBookingShare, repeatClientsShare, planCompletion, compareWithPreviousYear, branchPerformance } from '@/shared/lib/metrics'

const dataset = getDataset()
const ytd = { from: '2026-01-01', to: '2026-10-28' }

const isSortedBy = <T>(items: readonly T[], key: (item: T) => string): boolean =>
  items.every((item, index) => index === 0 || key(items[index - 1] as T) <= key(item))

describe('mock dataset: shape', () => {
  it('has the reference lists from the spec', () => {
    expect(dataset.branches.map((branch) => branch.name)).toEqual([
      'Центральный', 'Северный', 'Южный', 'Западный', 'Восточный', 'Речной', 'Парковый',
    ])
    expect(dataset.directions.map((direction) => direction.name)).toEqual([
      'Базовые услуги', 'Расширенные', 'Комплексные пакеты', 'Корп. договоры', 'Прочее',
    ])
    expect(dataset.channels.map((channel) => channel.name)).toEqual([
      'Контекстная реклама', 'SEO и контент', 'Карты и агрегаторы', 'Соцсети', 'Партнёрские программы', 'Email и CRM-рассылки',
    ])
  })

  it('covers 22 months from January of the previous year to October 2026', () => {
    const months = new Set(dataset.records.map((record) => record.slotDate.slice(0, 7)))
    expect(months.size).toBe(22)
    expect(dataset.meta.from).toBe('2025-01-01')
    expect(dataset.records[0]?.slotDate.startsWith('2025-01')).toBe(true)
    expect(dataset.records.at(-1)?.slotDate.startsWith('2026-10')).toBe(true)
    expect(dataset.plans.filter((plan) => plan.branchId === 'central')).toHaveLength(24)
  })

  it('keeps dated arrays sorted, which the range lookups rely on', () => {
    expect(isSortedBy(dataset.records, (r) => r.slotDate)).toBe(true)
    expect(isSortedBy(dataset.slots, (s) => s.date)).toBe(true)
    expect(isSortedBy(dataset.leads, (l) => l.createdAt)).toBe(true)
    expect(isSortedBy(dataset.marketingExpenses, (e) => e.date)).toBe(true)
    expect(isSortedBy(dataset.webAnalytics, (w) => w.date)).toBe(true)
  })

  it('is deterministic for a seed and differs between seeds', () => {
    const again = generateDataset()
    expect(again.records.length).toBe(dataset.records.length)
    expect(again.records.slice(0, 300)).toEqual(dataset.records.slice(0, 300))
    expect(again.leads.slice(-300)).toEqual(dataset.leads.slice(-300))
    expect(generateDataset(7).records.length).not.toBe(dataset.records.length)
  })
})

describe('mock dataset: lead ↔ visit link', () => {
  const recordsById = new Map(dataset.records.map((record) => [record.id, record]))
  const linkedLeads = dataset.leads.filter((lead) => lead.recordId !== null)

  it('links leads to visits of the same client by phone', () => {
    expect(linkedLeads.length).toBeGreaterThan(30_000)
    linkedLeads.forEach((lead) => {
      const record = recordsById.get(lead.recordId as number)
      expect(record).toBeDefined()
      expect(record?.clientPhone).toBe(lead.phone)
    })
  })

  it('creates the booking after the lead and before the slot', () => {
    linkedLeads.forEach((lead) => {
      const record = recordsById.get(lead.recordId as number)!
      expect(lead.createdAt <= record.createdAt).toBe(true)
      expect(record.createdAt.slice(0, 10) <= record.slotDate).toBe(true)
    })
  })

  it('links only the first visit of a new client', () => {
    const firstVisit = new Map<number, string>()
    dataset.records.forEach((record) => {
      if (record.status !== 'completed') return
      const known = firstVisit.get(record.clientId)
      if (known === undefined || record.slotDate < known) firstVisit.set(record.clientId, record.slotDate)
    })
    linkedLeads.forEach((lead) => {
      const record = recordsById.get(lead.recordId as number)!
      if (record.status === 'completed') expect(firstVisit.get(record.clientId)).toBe(record.slotDate)
    })
  })
})

describe('mock dataset: slots and visits', () => {
  it('puts completed visits only on available slots, one per slot', () => {
    const slotsById = new Map(dataset.slots.map((slot) => [slot.id, slot]))
    const seen = new Set<number>()
    dataset.records.forEach((record) => {
      const slot = slotsById.get(record.slotId)!
      expect(slot.branchId).toBe(record.branchId)
      expect(slot.date).toBe(record.slotDate)
      expect(slot.hour).toBe(record.slotHour)
      if (record.status === 'completed') {
        expect(slot.available).toBe(true)
        expect(seen.has(record.slotId)).toBe(false)
        seen.add(record.slotId)
      }
    })
  })

  it('has payments only for completed visits', () => {
    dataset.records.forEach((record) => {
      if (record.status === 'completed') expect(record.amount).toBeGreaterThan(0)
      else expect(record.amount + record.refundAmount).toBe(0)
      if (record.refundDate) expect(record.refundDate > record.slotDate).toBe(true)
    })
  })
})

describe('mock dataset: realism of the aggregates', () => {
  it('grows 10–15% year over year with a September–October peak', () => {
    const { value, delta } = compareWithPreviousYear(dataset, 'revenue', ytd)
    expect(value).toBeGreaterThan(380_000_000)
    expect(delta).toBeGreaterThan(8)
    expect(delta).toBeLessThan(18)

    const monthRevenue = (month: string) => revenue(dataset, { from: `${month}-01`, to: `${month}-28` })
    const summer = ['2025-06', '2025-07', '2025-08'].reduce((sum, m) => sum + monthRevenue(m), 0) / 3
    const autumn = ['2025-09', '2025-10'].reduce((sum, m) => sum + monthRevenue(m), 0) / 2
    expect(autumn / summer).toBeGreaterThan(1.15)
  })

  it('keeps ratio metrics in sensible ranges', () => {
    expect(capacityLoad(dataset, ytd)).toBeGreaterThan(70)
    expect(capacityLoad(dataset, ytd)).toBeLessThan(90)
    expect(cancellationRate(dataset, ytd)).toBeGreaterThan(4)
    expect(cancellationRate(dataset, ytd)).toBeLessThan(10)
    expect(repeatClientsShare(dataset, ytd)).toBeGreaterThan(30)
    expect(repeatClientsShare(dataset, ytd)).toBeLessThan(60)
    expect(planCompletion(dataset, ytd)).toBeGreaterThan(95)
    expect(planCompletion(dataset, ytd)).toBeLessThan(108)
  })

  it('lowers cancellations and raises load and online share year over year', () => {
    expect(compareWithPreviousYear(dataset, 'cancellationRate', ytd).delta).toBeLessThan(0)
    expect(compareWithPreviousYear(dataset, 'capacityLoad', ytd).delta).toBeGreaterThan(0)
    const may = onlineBookingShare(dataset, { from: '2026-05-01', to: '2026-05-31' }) as number
    const october = onlineBookingShare(dataset, { from: '2026-10-01', to: '2026-10-28' }) as number
    expect(october - may).toBeGreaterThan(10)
  })

  it('has branches both above and below plan, as in the reference', () => {
    const completions = branchPerformance(dataset, ytd).map((row) => row.planCompletion as number)
    expect(Math.max(...completions)).toBeGreaterThan(103)
    expect(Math.min(...completions)).toBeLessThan(95)
  })

  it('is at the scale of the reference screenshots', () => {
    const marketing = compareWithPreviousYear(dataset, 'leads', ytd)
    expect(marketing.value).toBeGreaterThan(55_000)
    expect(marketing.value).toBeLessThan(75_000)
    expect(marketing.delta).toBeGreaterThan(8)
    expect(compareWithPreviousYear(dataset, 'cpl', ytd).delta).toBeLessThan(0)
  })
})
