export interface BranchPlan {
  branchId: string
  /** `YYYY-MM` */
  month: string
  /** Revenue plan for the whole month, ₽. */
  revenue: number
}
