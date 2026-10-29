export interface MarketingExpense {
  /** `YYYY-MM-DD` */
  date: string
  channelId: string
  campaign: string
  /** ₽ */
  amount: number
}
