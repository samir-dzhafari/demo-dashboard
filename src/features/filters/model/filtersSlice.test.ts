import { describe, expect, it } from 'vitest'
import { ALL_BRANCHES } from '@/entities/branch'
import {
  filtersReducer,
  initialFiltersState,
  resetFilters,
  selectAllBranches,
  setBranches,
  setChannels,
  setComparison,
  setPeriod,
  toggleBranch,
} from './filtersSlice'
import { monthPeriod } from './period'
import { selectFilters, selectMetricFilters, selectSelectedBranchObjects } from './selectors'

describe('filtersSlice', () => {
  it('defaults to year-to-date until yesterday, all branches and channels, vs. previous year', () => {
    expect(initialFiltersState.period).toEqual({ kind: 'ytd', from: '2026-01-01', to: '2026-10-28' })
    expect(initialFiltersState.branches).toHaveLength(ALL_BRANCHES.length)
    expect(initialFiltersState.channels).toHaveLength(6)
    expect(initialFiltersState.comparison).toBe('yoy')
  })

  it('toggleBranch removes a selected branch and adds it back', () => {
    const without = filtersReducer(undefined, toggleBranch('north'))
    expect(without.branches).not.toContain('north')
    expect(filtersReducer(without, toggleBranch('north')).branches).toContain('north')
  })

  it('never empties the branch selection', () => {
    let state = filtersReducer(undefined, setBranches(['central']))
    state = filtersReducer(state, toggleBranch('central'))
    expect(state.branches).toEqual(['central'])
    expect(filtersReducer(state, setBranches([])).branches).toEqual(['central'])
  })

  it('selectAllBranches restores every branch', () => {
    const state = filtersReducer(filtersReducer(undefined, setBranches(['central'])), selectAllBranches())
    expect(state.branches).toEqual(ALL_BRANCHES.map((branch) => branch.id))
  })

  it('setPeriod stores kind and range', () => {
    const state = filtersReducer(undefined, setPeriod(monthPeriod(2026, 9)))
    expect(state.period).toEqual({ kind: 'month', from: '2026-09-01', to: '2026-09-30' })
  })

  it('resetFilters returns the initial state', () => {
    let state = filtersReducer(undefined, setBranches(['central']))
    state = filtersReducer(state, setComparison('plan'))
    state = filtersReducer(state, setChannels(['ads']))
    state = filtersReducer(state, setPeriod(monthPeriod(2026, 9)))
    expect(filtersReducer(state, resetFilters())).toEqual(initialFiltersState)
  })

  it('selectFilters returns the slice state and derived selectors are memoized', () => {
    const state = { filters: filtersReducer(undefined, setBranches(['central', 'park'])) }
    expect(selectFilters(state)).toBe(state.filters)
    expect(selectSelectedBranchObjects(state).map((branch) => branch.id)).toEqual(['central', 'park'])
    const metricFilters = selectMetricFilters(state)
    expect(metricFilters).toMatchObject({ from: '2026-01-01', to: '2026-10-28', branchIds: ['central', 'park'], channelIds: [] })
    expect(selectMetricFilters({ filters: state.filters })).toBe(metricFilters)
  })
})
