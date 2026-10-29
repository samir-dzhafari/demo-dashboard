import { useMemo } from 'react'
import { useMetricFilters } from '@/features/filters'
import { getDataset } from '@/shared/api/mocks'
import { monthShort } from '@/shared/lib/format'
import { bookingSourcesByMonth, type BookingSourcesPoint } from '@/shared/lib/metrics'

export interface SourcesPoint extends BookingSourcesPoint {
  label: string
  /** Thousands, for the chart. */
  onlineK: number
  messengerK: number
  phoneK: number
}

export interface BookingSources {
  points: SourcesPoint[]
  /** Share of online bookings in the last month. */
  lastShare: number | null
  /** Change of that share since the first month shown, p.p. */
  shareDelta: number | null
}

/** Last 6 months of new bookings by method. Period end and the branch filter apply (records have no channel). */
export const useBookingSources = (): BookingSources => {
  const { to, branchIds } = useMetricFilters()
  return useMemo(() => {
    const raw = bookingSourcesByMonth(getDataset(), { to, branchIds })
    const points = raw.map((point) => ({
      ...point,
      label: monthShort(point.month),
      onlineK: point.online / 1000,
      messengerK: point.messenger / 1000,
      phoneK: point.phone / 1000,
    }))
    const first = raw[0]?.onlineShare ?? null
    const last = raw[raw.length - 1]?.onlineShare ?? null
    return { points, lastShare: last, shareDelta: first === null || last === null ? null : last - first }
  }, [to, branchIds])
}
