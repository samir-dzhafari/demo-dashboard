// @vitest-environment jsdom
import { configureStore } from '@reduxjs/toolkit'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { filtersReducer, selectMetricFilters, setBranches, setPeriod } from '@/features/filters'
import { getDataset } from '@/shared/api/mocks'
import { formatNumber, formatPercent } from '@/shared/lib/format'
import { bookingSourcesByMonth, channelEfficiency, leadsCount } from '@/shared/lib/metrics'
import { MarketingPage } from './MarketingPage'

const renderPage = () => {
  const store = configureStore({ reducer: { filters: filtersReducer } })
  render(
    <Provider store={store}>
      <MemoryRouter>
        <MarketingPage />
      </MemoryRouter>
    </Provider>,
  )
  return store
}

const kpiValue = (key: string): string => within(screen.getByTestId(`kpi-${key}`)).getByTestId('kpi-value').textContent ?? ''
const funnelLeads = (): string => within(screen.getByTestId('acquisition-funnel')).getByText('Лиды').parentElement?.textContent ?? ''

describe('MarketingPage', () => {
  it('renders every widget of the screen', () => {
    renderPage()
    expect(screen.getByText('Воронка привлечения')).toBeInTheDocument()
    expect(screen.getByText('Лиды по неделям и стоимость лида')).toBeInTheDocument()
    expect(screen.getByText('Эффективность каналов')).toBeInTheDocument()
    expect(screen.getByText('Источники записи')).toBeInTheDocument()
    expect(screen.getByText(/Последний значимый/)).toBeInTheDocument()
    expect(screen.getByTestId('channel-total')).toHaveTextContent('Итого')
  })

  it('shows the lowered CPL and CAC in green and the raised ROMI in green', () => {
    renderPage()
    ;['cpl', 'cac'].forEach((key) => {
      const card = screen.getByTestId(`kpi-${key}`)
      expect(card.textContent).toContain('▼')
      expect(card.querySelector('.text-emerald-600')).not.toBeNull()
      expect(card.querySelector('.text-red-500')).toBeNull()
    })
    expect(screen.getByTestId('kpi-romi').querySelector('.text-emerald-600')).not.toBeNull()
  })

  it('a channel row click filters KPI, funnel and table, and the second click resets', () => {
    const store = renderPage()
    const dataset = getDataset()
    const allLeads = kpiValue('leads')
    const channel = channelEfficiency(dataset, selectMetricFilters(store.getState())).rows[1]!
    const name = dataset.channels.find((item) => item.id === channel.channelId)!.name

    fireEvent.click(screen.getByRole('cell', { name }))
    expect(store.getState().filters.channels).toEqual([channel.channelId])
    expect(kpiValue('leads')).toBe(formatNumber(channel.leads))
    expect(kpiValue('leads')).not.toBe(allLeads)
    expect(funnelLeads()).toContain(formatNumber(channel.leads))
    expect(screen.getByTestId('channel-total').textContent).toContain(formatNumber(channel.leads))
    expect(screen.getByRole('button', { name: /Канал:/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('cell', { name }))
    expect(store.getState().filters.channels).toHaveLength(6)
    expect(kpiValue('leads')).toBe(allLeads)
  })

  it('sorts the channel table by a column', () => {
    renderPage()
    const firstChannel = () => screen.getAllByRole('row')[1]?.textContent ?? ''
    const before = firstChannel()
    fireEvent.click(screen.getByRole('button', { name: 'Лиды' }))
    const byLeadsDesc = firstChannel()
    fireEvent.click(screen.getByRole('button', { name: 'Лиды' }))
    expect(byLeadsDesc).not.toBe(firstChannel())
    expect(before).toBeTruthy()
  })

  it('period and branch filters change the widgets together', () => {
    const store = renderPage()
    const initialLeads = kpiValue('leads')

    act(() => {
      store.dispatch(setPeriod({ kind: 'month', from: '2026-09-01', to: '2026-09-30' }))
    })
    expect(kpiValue('leads')).toBe(formatNumber(leadsCount(getDataset(), selectMetricFilters(store.getState()))))
    expect(kpiValue('leads')).not.toBe(initialLeads)

    act(() => {
      store.dispatch(setBranches(['central']))
    })
    const sources = bookingSourcesByMonth(getDataset(), selectMetricFilters(store.getState()))
    expect(sources[sources.length - 1]!.month).toBe('2026-09')
    expect(screen.getByTestId('online-share').textContent).toContain(formatPercent(sources[sources.length - 1]!.onlineShare!, 0))
    expect(screen.getByText(/Доля самостоятельной онлайн-записи в сентябре/)).toBeInTheDocument()
  })

  it('shows empty states when the period has no data', () => {
    const store = renderPage()
    act(() => {
      store.dispatch(setPeriod({ kind: 'custom', from: '2024-01-01', to: '2024-01-31' }))
    })
    expect(screen.getAllByText('Нет данных за выбранный период').length).toBeGreaterThanOrEqual(3)
  })

  it('a funnel stage click shows the "second release" toast', () => {
    renderPage()
    fireEvent.click(within(screen.getByTestId('acquisition-funnel')).getByText('Записи'))
    expect(screen.getByRole('status')).toHaveTextContent('во второй очереди')
  })
})
