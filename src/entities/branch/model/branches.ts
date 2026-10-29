import { BRANCHES } from '@/shared/api/mocks'
import type { Branch } from './types'

/** Branch directory of the network (static for the demo). */
export const ALL_BRANCHES: readonly Branch[] = BRANCHES.map(({ id, name }) => ({ id, name }))
