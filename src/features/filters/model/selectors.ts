import { createSelector } from '@reduxjs/toolkit'
import { ALL_BRANCHES, type Branch } from '@/entities/branch'
import { ALL_CHANNELS, type Channel } from '@/entities/channel'
import type { MetricFilters } from '@/shared/lib/metrics'
import type { FiltersState } from './filtersSlice'

/** Selectors take the slice state so that the feature does not depend on the shape of the app's RootState. */
type WithFilters = { filters: FiltersState }

export const selectFilters = (state: WithFilters): FiltersState => state.filters
export const selectPeriod = (state: WithFilters) => state.filters.period
export const selectBranches = (state: WithFilters) => state.filters.branches
export const selectComparison = (state: WithFilters) => state.filters.comparison
export const selectChannels = (state: WithFilters) => state.filters.channels
export const selectDirections = (state: WithFilters) => state.filters.directions

export const selectSelectedBranchObjects = createSelector([selectBranches], (ids): Branch[] =>
  ALL_BRANCHES.filter((branch) => ids.includes(branch.id)),
)

export const selectSelectedChannelObjects = createSelector([selectChannels], (ids): Channel[] =>
  ALL_CHANNELS.filter((channel) => ids.includes(channel.id)),
)

/**
 * Filters in the form the metric functions expect (an empty list means "all").
 * Memoized: the result keeps its identity until a filter changes. Widgets recompute metrics from it via `useMemo`.
 */
export const selectMetricFilters = createSelector(
  [selectPeriod, selectBranches, selectChannels, selectDirections],
  (period, branches, channels, directions): MetricFilters => ({
    from: period.from,
    to: period.to,
    branchIds: branches.length === ALL_BRANCHES.length ? [] : branches,
    channelIds: channels.length === ALL_CHANNELS.length ? [] : channels,
    ...(directions.length > 0 && { directionIds: directions }),
  }),
)
