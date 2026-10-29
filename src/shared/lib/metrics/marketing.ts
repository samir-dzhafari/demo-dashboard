import type { Lead } from '@/entities/lead'
import type { VisitRecord } from '@/entities/record'
import type { Dataset } from '@/shared/api/mocks'
import { diffDays } from '@/shared/lib/date'
import { idPredicate, memoizeByDataset, percent, safeDivide, sliceByDate, type MetricFilters } from './filters'
import { completedVisitsPerClient } from './sales'

/*
 * Leads, budgets and web visits carry no branch, so marketing metrics ignore `branchIds` and `directionIds`
 * (see README, "Зафиксированные трактовки").
 */

const DUPLICATE_WINDOW_DAYS = 7

/** Ids of leads that count: the first lead of a phone, then none within 7 days of the last counted one. */
const uniqueLeadIds = (dataset: Dataset): Set<number> =>
  memoizeByDataset(dataset, 'unique-lead-ids', () => {
    const lastCounted = new Map<string, string>()
    const unique = new Set<number>()
    dataset.leads.forEach((lead) => {
      const date = lead.createdAt.slice(0, 10)
      const previous = lastCounted.get(lead.phone)
      if (previous === undefined || diffDays(date, previous) >= DUPLICATE_WINDOW_DAYS) {
        lastCounted.set(lead.phone, date)
        unique.add(lead.id)
      }
    })
    return unique
  })

const recordsById = (dataset: Dataset): Map<number, VisitRecord> =>
  memoizeByDataset(dataset, 'records-by-id', () => new Map(dataset.records.map((record) => [record.id, record])))

/** Unique leads created in the period (by lead creation date), optionally limited to channels. */
export const uniqueLeads = (dataset: Dataset, { from, to, channelIds }: MetricFilters): Lead[] => {
  const unique = uniqueLeadIds(dataset)
  const channelMatches = idPredicate(channelIds)
  return sliceByDate(dataset.leads, from, to, (lead) => lead.createdAt).filter(
    (lead) => unique.has(lead.id) && channelMatches(lead.channelId),
  )
}

export const leadsCount = (dataset: Dataset, filters: MetricFilters): number => uniqueLeads(dataset, filters).length

export const marketingBudget = (dataset: Dataset, { from, to, channelIds }: MetricFilters): number => {
  const channelMatches = idPredicate(channelIds)
  return sliceByDate(dataset.marketingExpenses, from, to, (expense) => expense.date)
    .filter((expense) => channelMatches(expense.channelId))
    .reduce((sum, expense) => sum + expense.amount, 0)
}

export interface LeadWithRecord {
  lead: Lead
  record: VisitRecord
}

const linkedLeads = (dataset: Dataset, leads: Lead[]): LeadWithRecord[] => {
  const byId = recordsById(dataset)
  const linked: LeadWithRecord[] = []
  leads.forEach((lead) => {
    const record = lead.recordId === null ? undefined : byId.get(lead.recordId)
    if (record) linked.push({ lead, record })
  })
  return linked
}

/** Leads that have a booking created. */
export const leadsWithBooking = (dataset: Dataset, filters: MetricFilters): LeadWithRecord[] =>
  linkedLeads(dataset, uniqueLeads(dataset, filters))

/** Leads whose booking took place: these are the "new clients" of CAC and ROMI. */
export const leadsWithVisit = (dataset: Dataset, filters: MetricFilters): LeadWithRecord[] =>
  leadsWithBooking(dataset, filters).filter(({ record }) => record.status === 'completed')

/** Booking conversion = leads with a booking ÷ leads × 100. */
export const bookingConversion = (dataset: Dataset, filters: MetricFilters): number | null =>
  percent(leadsWithBooking(dataset, filters).length, leadsCount(dataset, filters))

/** CPL = marketing budget ÷ leads. */
export const costPerLead = (dataset: Dataset, filters: MetricFilters): number | null =>
  safeDivide(marketingBudget(dataset, filters), leadsCount(dataset, filters))

export const newClientsCount = (dataset: Dataset, filters: MetricFilters): number =>
  new Set(leadsWithVisit(dataset, filters).map(({ record }) => record.clientId)).size

/** CAC = marketing budget ÷ new clients with a completed visit. */
export const customerAcquisitionCost = (dataset: Dataset, filters: MetricFilters): number | null =>
  safeDivide(marketingBudget(dataset, filters), newClientsCount(dataset, filters))

/** Revenue of the first visit of clients brought by the leads (net of refunds). */
export const newClientsRevenue = (dataset: Dataset, filters: MetricFilters): number =>
  leadsWithVisit(dataset, filters).reduce((sum, { record }) => sum + record.amount - record.refundAmount, 0)

/** ROMI = (first-visit revenue of new clients − budget) ÷ budget × 100. */
export const romi = (dataset: Dataset, filters: MetricFilters): number | null => {
  const budget = marketingBudget(dataset, filters)
  const gain = newClientsRevenue(dataset, filters) - budget
  const ratio = safeDivide(gain, budget)
  return ratio === null ? null : ratio * 100
}

export type FunnelStageKey = 'visits' | 'leads' | 'bookings' | 'completed' | 'repeat'

export interface FunnelStage {
  key: FunnelStageKey
  count: number
  /** Conversion from the previous stage, %. Null for the first stage. */
  conversionFromPrevious: number | null
}

export const acquisitionFunnel = (dataset: Dataset, filters: MetricFilters): FunnelStage[] => {
  const channelMatches = idPredicate(filters.channelIds)
  const visits = sliceByDate(dataset.webAnalytics, filters.from, filters.to, (row) => row.date)
    .filter((row) => channelMatches(row.channelId))
    .reduce((sum, row) => sum + row.visits, 0)

  const visitsPerClient = completedVisitsPerClient(dataset, { from: filters.from, to: filters.to })
  const completedClients = new Set(leadsWithVisit(dataset, filters).map(({ record }) => record.clientId))
  let repeat = 0
  completedClients.forEach((clientId) => {
    if ((visitsPerClient.get(clientId) ?? 0) >= 2) repeat += 1
  })

  const counts: Array<[FunnelStageKey, number]> = [
    ['visits', visits],
    ['leads', leadsCount(dataset, filters)],
    ['bookings', leadsWithBooking(dataset, filters).length],
    ['completed', completedClients.size],
    ['repeat', repeat],
  ]
  return counts.map(([key, count], index) => ({
    key,
    count,
    conversionFromPrevious: index === 0 ? null : percent(count, (counts[index - 1] as [FunnelStageKey, number])[1]),
  }))
}

export interface ChannelStats {
  channelId: string
  budget: number
  leads: number
  cpl: number | null
  bookingConversion: number | null
  newClients: number
  cac: number | null
  romi: number | null
}

const channelStats = (dataset: Dataset, filters: MetricFilters, channelId: string): ChannelStats => ({
  channelId,
  budget: marketingBudget(dataset, filters),
  leads: leadsCount(dataset, filters),
  cpl: costPerLead(dataset, filters),
  bookingConversion: bookingConversion(dataset, filters),
  newClients: newClientsCount(dataset, filters),
  cac: customerAcquisitionCost(dataset, filters),
  romi: romi(dataset, filters),
})

export const TOTAL_CHANNEL_ID = 'total'

/** Per-channel rows plus a total row that is computed from the raw data, not by summing the rows. */
export const channelEfficiency = (
  dataset: Dataset,
  filters: MetricFilters,
): { rows: ChannelStats[]; total: ChannelStats } => {
  const channelMatches = idPredicate(filters.channelIds)
  const selected = dataset.channels.filter((channel) => channelMatches(channel.id))
  return {
    rows: selected.map((channel) => channelStats(dataset, { ...filters, channelIds: [channel.id] }, channel.id)),
    total: channelStats(dataset, { ...filters, channelIds: selected.map((channel) => channel.id) }, TOTAL_CHANNEL_ID),
  }
}
