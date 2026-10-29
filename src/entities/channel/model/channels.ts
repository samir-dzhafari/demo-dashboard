import { CHANNELS } from '@/shared/api/mocks'
import type { Channel } from './types'

/** Marketing channel directory (static for the demo). */
export const ALL_CHANNELS: readonly Channel[] = CHANNELS.map(({ id, name }) => ({ id, name }))
