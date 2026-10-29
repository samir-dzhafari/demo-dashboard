import type { BookingMethod, VisitRecord, VisitStatus } from '@/entities/record'
import type { Lead } from '@/entities/lead'
import type { MarketingExpense } from '@/entities/marketing-expense'
import type { BranchPlan } from '@/entities/plan'
import type { Resource, Slot } from '@/entities/slot'
import type { WebAnalyticsRow } from '@/entities/web-analytics'
import { daysInMonth, eachDay, monthKey, weekdayIndex } from '@/shared/lib/date'
import {
  AVAILABILITY_SEASON,
  BOOKING_LEAD_TIME,
  BRANCHES,
  CANCEL_CALIBRATION,
  CHANNELS,
  DATA_END,
  DATA_START,
  DEFAULT_SEED,
  DIRECTIONS,
  DUPLICATE_LEAD_RATE,
  FIRST_HOUR,
  FIRST_VISIT_PRICE_UPLIFT,
  GROWTH,
  HOUR_WEIGHTS,
  INITIAL_CLIENTS_PER_RESOURCE,
  LAST_HOUR,
  LEAD_BOOKING_FAILURE,
  LEAD_SHARE_OF_NEW_CLIENTS,
  LOAD_CALIBRATION,
  LOAD_SEASON,
  LOAD_SEASON_MEAN,
  MESSENGER_SHARE,
  NEW_CLIENT_PROBABILITY,
  NO_SHOW_SHARE_OF_LOST,
  ONLINE_SHARE_ANCHORS,
  PLAN_GROWTH_FOR_FUTURE_MONTHS,
  PRICE_SCALE,
  REFUND_PROBABILITY,
  RETURNING_CLIENT_RECENCY_SKEW,
  TREND_CENTER,
  UPDATED_AT,
  WEEKDAY_WEIGHTS,
  WEEKEND_EVENING_FACTOR,
} from './config'
import type { Dataset } from './types'
import { at, clamp, createRandom, lerp, pad2, pickOne, pickWeighted, randInt, type Random } from './rng'

const RESOURCE_KINDS: ReadonlyArray<Resource['kind']> = ['room', 'equipment', 'specialist']
const RESOURCE_KIND_NAMES: Record<Resource['kind'], string> = {
  room: 'Кабинет',
  equipment: 'Оборудование',
  specialist: 'Специалист',
}

/** Bijective for ids below 9e8, so every id gets its own phone number. */
const phoneFromId = (id: number): string => {
  const digits = String(9_000_000_000 + ((id * 7919) % 900_000_000))
  return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`
}

const PROSPECT_ID_OFFSET = 10_000_000

const onlineShareAt = (monthIdx: number): number => {
  for (let i = 1; i < ONLINE_SHARE_ANCHORS.length; i++) {
    const [monthB, shareB] = at(ONLINE_SHARE_ANCHORS, i)
    if (monthIdx <= monthB) {
      const [monthA, shareA] = at(ONLINE_SHARE_ANCHORS, i - 1)
      return lerp(shareA, shareB, (monthIdx - monthA) / (monthB - monthA))
    }
  }
  return at(ONLINE_SHARE_ANCHORS, ONLINE_SHARE_ANCHORS.length - 1)[1]
}

const pickReturningClient = (rnd: Random, pool: readonly number[]): number =>
  at(pool, Math.min(pool.length - 1, Math.floor(pool.length * (1 - rnd() ** RETURNING_CLIENT_RECENCY_SKEW))))

const roundTo10 = (value: number): number => Math.round(value / 10) * 10

interface ConvertedLead {
  dayIdx: number
  createdAt: string
  phone: string
  channelIdx: number
  campaign: string
  recordId: number
}

/**
 * Builds the whole demo network deterministically from `seed`.
 *
 * Order matters: slots and visits are generated day by day (demand → bookings → clients), then leads are derived
 * from new-client visits, then web analytics / expenses from leads, and finally plans from actual revenue.
 * That way every number the formulas touch is consistent by construction.
 */
export const generateDataset = (seed: number = DEFAULT_SEED): Dataset => {
  const rnd = createRandom(seed)
  const days = eachDay({ from: DATA_START, to: DATA_END })
  const lastDayIdx = days.length - 1

  const monthIdxOfDay = days.map((day) => (Number(day.slice(0, 4)) - 2025) * 12 + Number(day.slice(5, 7)) - 1)
  const weekdayOfDay = days.map(weekdayIndex)
  const monthCount = at(monthIdxOfDay, lastDayIdx) + 1

  const resources: Resource[] = []
  BRANCHES.forEach((branch) => {
    for (let n = 0; n < branch.resources; n++) {
      const kind = at(RESOURCE_KINDS, n % RESOURCE_KINDS.length)
      resources.push({ id: `${branch.id}-r${n + 1}`, branchId: branch.id, kind, name: `${RESOURCE_KIND_NAMES[kind]} ${n + 1}` })
    }
  })

  const demandModifier = WEEKDAY_WEIGHTS.map((weekdayWeight, weekday) =>
    HOUR_WEIGHTS.map((hourWeight, hourIdx) => {
      const isWeekendEvening = weekday >= 5 && FIRST_HOUR + hourIdx >= 17
      return weekdayWeight * hourWeight * (isWeekendEvening ? WEEKEND_EVENING_FACTOR : 1)
    }),
  )
  const demandMean = demandModifier.flat().reduce((sum, value) => sum + value, 0) / (7 * HOUR_WEIGHTS.length)

  const directionWeights = (monthIdx: number, firstVisitFromLead: boolean): number[] =>
    DIRECTIONS.map((direction) => {
      const share = lerp(direction.visitShareStart, direction.visitShareEnd, monthIdx / (monthCount - 1))
      return firstVisitFromLead ? share * direction.firstVisitBoost : share
    })
  const regularWeights = Array.from({ length: monthCount }, (_, m) => directionWeights(m, false))
  const firstVisitWeights = Array.from({ length: monthCount }, (_, m) => directionWeights(m, true))

  const phones: string[] = [phoneFromId(0)]
  const registerClient = (): number => {
    const id = phones.length
    phones.push(phoneFromId(id))
    return id
  }
  const pools: number[][] = BRANCHES.map((branch) => {
    const pool: number[] = []
    for (let n = 0; n < branch.resources * INITIAL_CLIENTS_PER_RESOURCE; n++) pool.push(registerClient())
    return pool
  })

  const slots: Slot[] = []
  const records: VisitRecord[] = []
  const convertedLeads: ConvertedLead[] = []

  const stamp = (dayIdx: number, hour: number, minute: number): string => `${at(days, dayIdx)}T${pad2(hour)}:${pad2(minute)}`

  const bookingMethod = (monthIdx: number): BookingMethod => {
    const roll = rnd()
    const online = onlineShareAt(monthIdx)
    if (roll < online) return 'online'
    return roll < online + MESSENGER_SHARE ? 'messenger' : 'phone'
  }

  const createdAtForRegularBooking = (dayIdx: number, slotHour: number): string => {
    const leadTime = pickWeighted(rnd, BOOKING_LEAD_TIME.map(([d]) => d), BOOKING_LEAD_TIME.map(([, w]) => w))
    const createdDayIdx = Math.max(0, dayIdx - leadTime)
    const sameDay = createdDayIdx === dayIdx
    const hour = sameDay ? randInt(rnd, Math.max(0, slotHour - 6), slotHour - 1) : randInt(rnd, 7, 22)
    return stamp(createdDayIdx, hour, randInt(rnd, 0, 59))
  }

  const pushRecord = (record: Omit<VisitRecord, 'id'>): number => {
    const id = records.length + 1
    records.push({ id, ...record })
    return id
  }

  for (let dayIdx = 0; dayIdx <= lastDayIdx; dayIdx++) {
    const date = at(days, dayIdx)
    const monthIdx = at(monthIdxOfDay, dayIdx)
    const calendarMonth = Number(date.slice(5, 7)) - 1
    const weekday = at(weekdayOfDay, dayIdx)
    const trendShift = monthIdx - TREND_CENTER

    const availability = at(AVAILABILITY_SEASON, calendarMonth) + GROWTH.availabilityPerMonth * trendShift
    const loadFactor = (at(LOAD_SEASON, calendarMonth) / LOAD_SEASON_MEAN) * (1 + GROWTH.loadPerMonth * trendShift)
    const priceTrend = 1 + GROWTH.pricePerMonth * trendShift
    const leadSharePerNewClient = LEAD_SHARE_OF_NEW_CLIENTS * (1 + GROWTH.leadShareOfNewClientsPerMonth * trendShift)
    const demandByHour = at(demandModifier, weekday)

    BRANCHES.forEach((branch, branchIdx) => {
      const pool = at(pools, branchIdx)
      const cancelShare = branch.cancelRate * CANCEL_CALIBRATION * (1 + GROWTH.cancelPerMonth * trendShift)
      const cancelOdds = cancelShare / (1 - cancelShare)

      const bookVisit = (slotId: number, resourceId: string, hour: number, status: VisitStatus, forcedClient?: number): void => {
        const isNewClient = forcedClient === undefined && (pool.length === 0 || rnd() < NEW_CLIENT_PROBABILITY)
        const clientId = forcedClient ?? (isNewClient ? registerClient() : pickReturningClient(rnd, pool))
        const phone = at(phones, clientId)

        let leadChannelIdx = -1
        let leadDayIdx = -1
        if (status === 'completed' && isNewClient && rnd() < leadSharePerNewClient) {
          leadDayIdx = dayIdx - randInt(rnd, 1, 6)
          if (leadDayIdx >= 0) leadChannelIdx = pickWeighted(rnd, CHANNELS.map((_, i) => i), CHANNELS.map((c) => c.leadShare * c.conversion))
        }
        const cameFromLead = leadChannelIdx >= 0

        let finalStatus = status
        if (cameFromLead && rnd() < LEAD_BOOKING_FAILURE) finalStatus = rnd() < 0.6 ? 'canceled' : 'no_show'
        const isCompleted = finalStatus === 'completed'

        const direction = pickWeighted(
          rnd,
          DIRECTIONS,
          at(cameFromLead ? firstVisitWeights : regularWeights, monthIdx),
        )
        const service = pickOne(rnd, direction.services)

        let amount = 0
        let refundAmount = 0
        let refundDate: string | null = null
        if (isCompleted) {
          const uplift = cameFromLead ? FIRST_VISIT_PRICE_UPLIFT : 1
          amount = roundTo10(service.price * PRICE_SCALE * branch.priceIndex * priceTrend * uplift * (0.88 + 0.24 * rnd()))
          const refundDayIdx = dayIdx + randInt(rnd, 1, 25)
          if (rnd() < REFUND_PROBABILITY && refundDayIdx <= lastDayIdx) {
            refundAmount = rnd() < 0.5 ? amount : roundTo10(amount / 2)
            refundDate = at(days, refundDayIdx)
          }
        }

        let createdAt: string
        if (cameFromLead) {
          const createdHour = randInt(rnd, 9, 20)
          const createdMinute = randInt(rnd, 0, 59)
          createdAt = stamp(leadDayIdx, createdHour, createdMinute)
          const leadMinuteOfDay = createdHour * 60 + createdMinute - randInt(rnd, 5, 90)
          const channel = at(CHANNELS, leadChannelIdx)
          convertedLeads.push({
            dayIdx: leadDayIdx,
            createdAt: stamp(leadDayIdx, Math.floor(leadMinuteOfDay / 60), leadMinuteOfDay % 60),
            phone,
            channelIdx: leadChannelIdx,
            campaign: pickOne(rnd, channel.campaigns),
            recordId: records.length + 1,
          })
        } else {
          createdAt = createdAtForRegularBooking(dayIdx, hour)
        }

        pushRecord({
          clientId,
          clientPhone: phone,
          branchId: branch.id,
          serviceId: service.id,
          directionId: direction.id,
          slotId,
          resourceId,
          slotDate: date,
          slotHour: hour,
          createdAt,
          status: finalStatus,
          amount,
          refundAmount,
          refundDate,
          bookingMethod: bookingMethod(monthIdx),
        })

        if (isCompleted && isNewClient) pool.push(clientId)
      }

      resources.forEach((resource) => {
        if (resource.branchId !== branch.id) return
        for (let hour = FIRST_HOUR; hour <= LAST_HOUR; hour++) {
          const slotId = slots.length
          const available = rnd() < availability
          slots.push({ id: slotId, branchId: branch.id, resourceId: resource.id, date, hour, available })
          if (!available) continue

          const demand = at(demandByHour, hour - FIRST_HOUR) / demandMean
          const bookingProbability = clamp(branch.baseLoad * LOAD_CALIBRATION * loadFactor * demand * (0.94 + 0.12 * rnd()), 0.05, 0.97)

          if (rnd() < bookingProbability) bookVisit(slotId, resource.id, hour, 'completed')

          if (rnd() < bookingProbability * cancelOdds) {
            const status: VisitStatus = rnd() < NO_SHOW_SHARE_OF_LOST ? 'no_show' : 'canceled'
            const existingClient = rnd() < 0.85 ? pickReturningClient(rnd, pool) : registerClient()
            bookVisit(slotId, resource.id, hour, status, existingClient)
          }
        }
      })
    })
  }

  // ---- Leads: converted ones come from visits; the rest of the funnel is added around them.
  const leadRows: Array<Omit<Lead, 'id'>> = []
  let prospectSeq = 0
  const newProspectPhone = (): string => phoneFromId(PROSPECT_ID_OFFSET + prospectSeq++)

  const addDuplicate = (phone: string, channelIdx: number, dayIdx: number): void => {
    const duplicateDayIdx = dayIdx + randInt(rnd, 1, 6)
    if (rnd() >= DUPLICATE_LEAD_RATE || duplicateDayIdx > lastDayIdx) return
    leadRows.push({
      createdAt: stamp(duplicateDayIdx, randInt(rnd, 8, 21), randInt(rnd, 0, 59)),
      phone,
      channelId: at(CHANNELS, channelIdx).id,
      campaign: pickOne(rnd, at(CHANNELS, channelIdx).campaigns),
      recordId: null,
    })
  }

  convertedLeads.forEach((lead) => {
    const channel = at(CHANNELS, lead.channelIdx)
    leadRows.push({
      createdAt: lead.createdAt,
      phone: lead.phone,
      channelId: channel.id,
      campaign: lead.campaign,
      recordId: lead.recordId,
    })
    addDuplicate(lead.phone, lead.channelIdx, lead.dayIdx)

    const trendShift = at(monthIdxOfDay, lead.dayIdx) - TREND_CENTER
    const conversion = clamp(channel.conversion * (1 + GROWTH.conversionPerMonth * trendShift), 0.05, 0.9)
    const unconvertedPerConverted = (1 - conversion) / conversion
    const extras = Math.floor(unconvertedPerConverted) + (rnd() < unconvertedPerConverted % 1 ? 1 : 0)
    for (let n = 0; n < extras; n++) {
      const extraDayIdx = clamp(lead.dayIdx + randInt(rnd, -10, 10), 0, lastDayIdx)
      const phone = newProspectPhone()
      leadRows.push({
        createdAt: stamp(extraDayIdx, randInt(rnd, 8, 21), randInt(rnd, 0, 59)),
        phone,
        channelId: channel.id,
        campaign: pickOne(rnd, channel.campaigns),
        recordId: null,
      })
      addDuplicate(phone, lead.channelIdx, extraDayIdx)
    }
  })

  leadRows.sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0))
  const leads: Lead[] = leadRows.map((row, index) => ({ id: index + 1, ...row }))

  // ---- Web analytics and marketing expenses follow the daily lead flow of each channel.
  const dayIdxByDate = new Map(days.map((day, index) => [day, index]))
  const leadsPerDayChannel = days.map(() => CHANNELS.map(() => 0))
  leads.forEach((lead) => {
    const dayIdx = dayIdxByDate.get(lead.createdAt.slice(0, 10))
    const channelIdx = CHANNELS.findIndex((channel) => channel.id === lead.channelId)
    if (dayIdx !== undefined && channelIdx >= 0) at(leadsPerDayChannel, dayIdx)[channelIdx]! += 1
  })

  const monthChannelLeads = new Map<string, number>()
  const monthDaysPresent = new Map<string, number>()
  days.forEach((day, dayIdx) => {
    const month = monthKey(day)
    monthDaysPresent.set(month, (monthDaysPresent.get(month) ?? 0) + 1)
    CHANNELS.forEach((_, channelIdx) => {
      const key = `${month}|${channelIdx}`
      monthChannelLeads.set(key, (monthChannelLeads.get(key) ?? 0) + at(at(leadsPerDayChannel, dayIdx), channelIdx))
    })
  })

  const webAnalytics: WebAnalyticsRow[] = []
  const marketingExpenses: MarketingExpense[] = []
  days.forEach((day, dayIdx) => {
    const month = monthKey(day)
    const trendShift = at(monthIdxOfDay, dayIdx) - TREND_CENTER
    CHANNELS.forEach((channel, channelIdx) => {
      const dayLeads = at(at(leadsPerDayChannel, dayIdx), channelIdx)
      const averageDailyLeads = (monthChannelLeads.get(`${month}|${channelIdx}`) ?? 0) / (monthDaysPresent.get(month) ?? 1)
      const smoothedLeads = 0.5 * dayLeads + 0.5 * averageDailyLeads

      const visits = Math.max(dayLeads, Math.round((smoothedLeads / channel.visitRate) * (0.9 + 0.2 * rnd())))
      webAnalytics.push({ date: day, channelId: channel.id, visits })

      const costPerLead = (channel.cpl * (1 + GROWTH.cplPerMonth * trendShift)) / (1 + DUPLICATE_LEAD_RATE)
      const dayBudget = smoothedLeads * costPerLead * (0.92 + 0.16 * rnd())
      const mainShare = 0.55 + 0.1 * rnd()
      channel.campaigns.forEach((campaign, campaignIdx) => {
        const share = campaignIdx === 0 ? mainShare : 1 - mainShare
        marketingExpenses.push({ date: day, channelId: channel.id, campaign, amount: Math.round(dayBudget * share) })
      })
    })
  })

  // ---- Plans: derived from actual revenue so that branch performance against plan is controlled.
  const actualRevenue = new Map<string, number>()
  const addRevenue = (branchId: string, month: string, value: number): void => {
    const key = `${branchId}|${month}`
    actualRevenue.set(key, (actualRevenue.get(key) ?? 0) + value)
  }
  records.forEach((record) => {
    if (record.status !== 'completed') return
    addRevenue(record.branchId, monthKey(record.slotDate), record.amount)
    if (record.refundDate) addRevenue(record.branchId, monthKey(record.refundDate), -record.refundAmount)
  })

  const plans: BranchPlan[] = []
  for (let monthIdx = 0; monthIdx < 24; monthIdx++) {
    const year = 2025 + Math.floor(monthIdx / 12)
    const month = `${year}-${pad2((monthIdx % 12) + 1)}`
    const isFuture = monthIdx >= monthCount
    BRANCHES.forEach((branch) => {
      let base: number
      if (isFuture) {
        const sameMonthLastYear = actualRevenue.get(`${branch.id}|${year - 1}-${pad2((monthIdx % 12) + 1)}`) ?? 0
        base = (sameMonthLastYear * PLAN_GROWTH_FOR_FUTURE_MONTHS) / (1 + branch.planDeviation * 0.5)
      } else {
        const presentDays = monthDaysPresent.get(month) ?? 0
        const fullMonthActual = ((actualRevenue.get(`${branch.id}|${month}`) ?? 0) * daysInMonth(month)) / presentDays
        const deviation = year === 2026 ? branch.planDeviation : branch.planDeviation * 0.6
        base = fullMonthActual / (1 + deviation + (rnd() - 0.5) * 0.03)
      }
      plans.push({ branchId: branch.id, month, revenue: Math.round(base / 1000) * 1000 })
    })
  }

  return {
    meta: { seed, from: DATA_START, to: DATA_END, updatedAt: UPDATED_AT },
    branches: BRANCHES.map(({ id, name }) => ({ id, name })),
    directions: DIRECTIONS.map(({ id, name }) => ({ id, name })),
    services: DIRECTIONS.flatMap((direction) =>
      direction.services.map((service) => ({ id: service.id, name: service.name, directionId: direction.id })),
    ),
    channels: CHANNELS.map(({ id, name }) => ({ id, name })),
    resources,
    records,
    slots,
    leads,
    marketingExpenses,
    plans,
    webAnalytics,
  }
}
