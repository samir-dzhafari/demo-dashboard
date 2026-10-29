export interface Resource {
  id: string
  branchId: string
  name: string
  kind: 'room' | 'equipment' | 'specialist'
}

export interface Slot {
  id: number
  branchId: string
  resourceId: string
  /** `YYYY-MM-DD` */
  date: string
  /** Start hour of the slot, 8..20. */
  hour: number
  /** False for planned downtime; such slots are excluded from capacity. */
  available: boolean
}
