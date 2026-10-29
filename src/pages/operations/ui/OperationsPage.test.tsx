// @vitest-environment jsdom
import { configureStore } from '@reduxjs/toolkit'
import { act, render, screen, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { filtersReducer, selectMetricFilters, setBranches, setPeriod } from '@/features/filters'
import { getDataset } from '@/shared/api/mocks'
import { formatMillions } from '@/shared/lib/format'
import { revenue } from '@/shared/lib/metrics'
import { OperationsPage } from './OperationsPage'

const renderPage = () => {
  const store = configureStore({ reducer: { filters: filtersReducer } })
  render(
    <Provider store={store}>
      <MemoryRouter>
        <OperationsPage />
      </MemoryRouter>
    </Provider>,
  )
  return store
}

const kpiValue = (key: string): string => within(screen.getByTestId(`kpi-${key}`)).getByTestId('kpi-value').textContent ?? ''

describe('OperationsPage', () => {
  it('cancellations: a decrease is green, an increase is red', () => {
    renderPage()
    const card = screen.getByTestId('kpi-cancellationRate')
    // Mock data lowers cancellations year over year.
    expect(card.textContent).toContain('▼')
    expect(card.querySelector('.text-emerald-600')).not.toBeNull()
    expect(card.querySelector('.text-red-500')).toBeNull()
  })

  it('period and branch filters change KPI, table and structure together', () => {
    const store = renderPage()
    const initial = kpiValue('revenue')
    act(() => {
      store.dispatch(setPeriod({ kind: 'month', from: '2026-09-01', to: '2026-09-30' }))
      store.dispatch(setBranches(['north']))
    })
    const filters = selectMetricFilters(store.getState())
    expect(kpiValue('revenue')).toBe(formatMillions(revenue(getDataset(), filters)))
    expect(kpiValue('revenue')).not.toBe(initial)
    expect(screen.getByText('Показатели филиалов').closest('section')?.textContent).toContain('Северный')
    expect(screen.getByText('Показатели филиалов').closest('section')?.textContent).not.toContain('Южный')
  })

  it('renders a period without data without NaN', () => {
    const store = renderPage()
    act(() => {
      store.dispatch(setPeriod({ kind: 'custom', from: '2024-01-01', to: '2024-01-31' }))
    })
    expect(document.body.textContent).not.toMatch(/NaN|Infinity/)
    expect(screen.getAllByText('Нет данных за выбранный период').length).toBeGreaterThanOrEqual(1)
  })
})
