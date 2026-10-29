/** Calendar date, `YYYY-MM-DD`. Lexicographic order equals chronological order. */
export type IsoDate = string

/** Local date-time without zone, `YYYY-MM-DDTHH:mm`. */
export type IsoDateTime = string

export type VisitStatus = 'completed' | 'canceled' | 'no_show'

export type BookingMethod = 'online' | 'messenger' | 'phone'

export interface VisitRecord {
  id: number
  clientId: number
  /** Lets a lead be matched to a visit by phone as well as by `Lead.recordId`. */
  clientPhone: string
  branchId: string
  serviceId: string
  directionId: string
  slotId: number
  resourceId: string
  slotDate: IsoDate
  slotHour: number
  createdAt: IsoDateTime
  status: VisitStatus
  /** Payment for a completed visit, ₽. Zero for canceled / no-show. */
  amount: number
  refundAmount: number
  /** Refunds are subtracted from revenue in the month of this date. */
  refundDate: IsoDate | null
  bookingMethod: BookingMethod
}
