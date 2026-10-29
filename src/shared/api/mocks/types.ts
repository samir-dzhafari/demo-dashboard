import type { Branch } from '@/entities/branch'
import type { Channel } from '@/entities/channel'
import type { Lead } from '@/entities/lead'
import type { MarketingExpense } from '@/entities/marketing-expense'
import type { BranchPlan } from '@/entities/plan'
import type { VisitRecord } from '@/entities/record'
import type { Service, ServiceDirection } from '@/entities/service'
import type { Resource, Slot } from '@/entities/slot'
import type { WebAnalyticsRow } from '@/entities/web-analytics'

export interface DatasetMeta {
  seed: number
  /** First and last day covered by the data (the last day is "yesterday" of the demo). */
  from: string
  to: string
  /** `YYYY-MM-DDTHH:mm`, shown in the dashboard header. */
  updatedAt: string
}

/**
 * Six datasets of the spec plus the reference lists.
 * Every array of dated rows is sorted ascending by its date field; metrics rely on this for fast range lookups.
 */
export interface Dataset {
  meta: DatasetMeta
  branches: Branch[]
  directions: ServiceDirection[]
  services: Service[]
  channels: Channel[]
  resources: Resource[]
  /** Sorted by `slotDate`. */
  records: VisitRecord[]
  /** Sorted by `date`. */
  slots: Slot[]
  /** Sorted by `createdAt`. Contains raw leads, duplicates included. */
  leads: Lead[]
  /** Sorted by `date`. */
  marketingExpenses: MarketingExpense[]
  plans: BranchPlan[]
  /** Sorted by `date`. */
  webAnalytics: WebAnalyticsRow[]
}
