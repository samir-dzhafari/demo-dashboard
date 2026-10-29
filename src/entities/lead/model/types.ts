export interface Lead {
  id: number
  /** `YYYY-MM-DDTHH:mm` */
  createdAt: string
  phone: string
  channelId: string
  campaign: string
  /** Visit record created from this lead, if any. */
  recordId: number | null
}
