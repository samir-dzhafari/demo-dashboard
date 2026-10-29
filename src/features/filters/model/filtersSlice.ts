import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { ALL_BRANCHES, type BranchId } from '@/entities/branch'
import { ALL_CHANNELS, type ChannelId } from '@/entities/channel'
import { ytdPeriod, type PeriodValue } from './period'

export type ComparisonBase = 'yoy' | 'plan'

export interface FiltersState {
  period: PeriodValue
  branches: BranchId[]
  comparison: ComparisonBase
  /** Used by the marketing screen. */
  channels: ChannelId[]
  /** Service-direction cross-filter set by clicking the revenue structure; empty means all directions. */
  directions: string[]
}

const allBranchIds = (): BranchId[] => ALL_BRANCHES.map((branch) => branch.id)
const allChannelIds = (): ChannelId[] => ALL_CHANNELS.map((channel) => channel.id)

/** Defaults of the spec: year-to-date until yesterday, all branches and channels, compared with the previous year. */
export const initialFiltersState: FiltersState = {
  period: ytdPeriod(),
  branches: allBranchIds(),
  comparison: 'yoy',
  channels: allChannelIds(),
  directions: [],
}

const toggled = (ids: string[], id: string): string[] => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id])

/**
 * Branch and channel selections never become empty: an empty id list means "all" for the metric functions,
 * so emptying a filter would silently flip its meaning. Updates that would empty a selection are ignored.
 */
const filtersSlice = createSlice({
  name: 'filters',
  initialState: initialFiltersState,
  reducers: {
    setPeriod: (state, action: PayloadAction<PeriodValue>) => {
      state.period = action.payload
    },
    setBranches: (state, action: PayloadAction<BranchId[]>) => {
      if (action.payload.length > 0) state.branches = action.payload
    },
    toggleBranch: (state, action: PayloadAction<BranchId>) => {
      const next = toggled(state.branches, action.payload)
      if (next.length > 0) state.branches = next
    },
    selectAllBranches: (state) => {
      state.branches = allBranchIds()
    },
    setComparison: (state, action: PayloadAction<ComparisonBase>) => {
      state.comparison = action.payload
    },
    setChannels: (state, action: PayloadAction<ChannelId[]>) => {
      if (action.payload.length > 0) state.channels = action.payload
    },
    toggleChannel: (state, action: PayloadAction<ChannelId>) => {
      const next = toggled(state.channels, action.payload)
      if (next.length > 0) state.channels = next
    },
    /** Selects one direction; passing the already selected one (or `null`) clears the cross-filter. */
    toggleDirection: (state, action: PayloadAction<string | null>) => {
      const id = action.payload
      state.directions = id === null || (state.directions.length === 1 && state.directions[0] === id) ? [] : [id]
    },
    resetFilters: () => initialFiltersState,
  },
})

export const {
  setPeriod,
  setBranches,
  toggleBranch,
  selectAllBranches,
  setComparison,
  setChannels,
  toggleChannel,
  toggleDirection,
  resetFilters,
} = filtersSlice.actions
export const filtersReducer = filtersSlice.reducer
