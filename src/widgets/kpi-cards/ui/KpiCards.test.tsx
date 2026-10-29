// @vitest-environment jsdom
import { configureStore } from '@reduxjs/toolkit'
import { act, render, screen, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { describe, expect, it } from 'vitest'
import { filtersReducer, selectMetricFilters, setBranches } from '@/features/filters'
import { getDataset } from '@/shared/api/mocks'
import { formatMillions, formatNumber } from '@/shared/lib/format'
import { revenue, servicesCount } from '@/shared/lib/metrics'
import { KpiCards } from './KpiCards'

const renderCards = () => {
  const store = configureStore({ reducer: { filters: filtersReducer } })
  render(
    <Provider store={store}>
      <KpiCards />
    </Provider>,
  )
  return store
}

const kpiValue = (key: string): string => within(screen.getByTestId(`kpi-${key}`)).getByTestId('kpi-value').textContent ?? ''

describe('KpiCards', () => {
  it('shows the metric values for the default filters', () => {
    const store = renderCards()
    const filters = selectMetricFilters(store.getState())
    expect(kpiValue('revenue')).toBe(formatMillions(revenue(getDataset(), filters)))
    expect(kpiValue('servicesCount')).toBe(formatNumber(servicesCount(getDataset(), filters)))
    expect(screen.getByText('цель 85%')).toBeInTheDocument()
  })

  it('recomputes revenue when a single branch is selected', () => {
    const store = renderCards()
    const allBranches = kpiValue('revenue')

    act(() => {
      store.dispatch(setBranches(['central']))
    })

    const central = formatMillions(revenue(getDataset(), selectMetricFilters(store.getState())))
    expect(kpiValue('revenue')).toBe(central)
    expect(central).not.toBe(allBranches)
  })
})
