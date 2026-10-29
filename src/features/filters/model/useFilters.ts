import { useCallback, useDeferredValue } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { BranchId } from '@/entities/branch'
import type { ChannelId } from '@/entities/channel'
import {
  resetFilters,
  selectAllBranches,
  setBranches,
  setChannels,
  setComparison,
  setPeriod,
  toggleDirection,
  type ComparisonBase,
  type FiltersState,
} from './filtersSlice'
import type { PeriodValue } from './period'
import { selectFilters, selectMetricFilters } from './selectors'

/**
 * Same typed hooks as `app/store/hooks`, bound to the slice-level state shape: the FSD lint rule forbids
 * `features` importing from `app`, and the app's `RootState` is structurally assignable to this one.
 */
const useFiltersSelector = useSelector.withTypes<{ filters: FiltersState }>()

/** Facade over the store: components read `filters` and call the setters without touching dispatch. */
export const useFilters = () => {
  const dispatch = useDispatch()
  const filters = useFiltersSelector(selectFilters)

  return {
    filters,
    setPeriod: useCallback((period: PeriodValue) => dispatch(setPeriod(period)), [dispatch]),
    setBranches: useCallback((ids: BranchId[]) => dispatch(setBranches(ids)), [dispatch]),
    setComparison: useCallback((base: ComparisonBase) => dispatch(setComparison(base)), [dispatch]),
    setChannels: useCallback((ids: ChannelId[]) => dispatch(setChannels(ids)), [dispatch]),
    selectAllBranches: useCallback(() => dispatch(selectAllBranches()), [dispatch]),
    toggleDirection: useCallback((id: string | null) => dispatch(toggleDirection(id)), [dispatch]),
    reset: useCallback(() => dispatch(resetFilters()), [dispatch]),
  }
}

/**
 * Store filters in the form the metric functions expect; keeps its identity until a filter changes.
 * The value is deferred: the filter controls repaint at once and the widgets catch up in a lower-priority render.
 */
export const useMetricFilters = () => useDeferredValue(useFiltersSelector(selectMetricFilters))
