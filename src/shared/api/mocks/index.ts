import { generateDataset } from './generateDataset'
import type { Dataset } from './types'

export type { Dataset, DatasetMeta } from './types'
export { generateDataset } from './generateDataset'
export { BRANCHES, CHANNELS, DATA_END, DATA_START, DEFAULT_SEED, FIRST_HOUR, LAST_HOUR, LEAD_LAG_DAYS, UPDATED_AT } from './config'

let cached: Dataset | undefined

/** The demo dataset. Generated once on first call (synchronously) and reused afterwards. */
export const getDataset = (): Dataset => {
  cached ??= generateDataset()
  return cached
}
