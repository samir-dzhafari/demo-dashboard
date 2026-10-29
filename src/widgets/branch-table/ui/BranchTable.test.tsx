// @vitest-environment jsdom
import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { describe, expect, it } from 'vitest'
import { filtersReducer } from '@/features/filters'
import { BranchTable } from './BranchTable'

const renderTable = () => {
  const store = configureStore({ reducer: { filters: filtersReducer } })
  render(
    <Provider store={store}>
      <BranchTable />
    </Provider>,
  )
  return store
}

describe('BranchTable', () => {
  it('lists every branch with a plan completion badge', () => {
    renderTable()
    expect(screen.getByText('Центральный')).toBeInTheDocument()
    expect(screen.getAllByText(/^\d+%$/).length).toBeGreaterThanOrEqual(7)
  })

  it('filters the whole screen by a branch on row click and resets on the second click', () => {
    const store = renderTable()
    expect(store.getState().filters.branches).toHaveLength(7)

    fireEvent.click(screen.getByText('Северный'))
    expect(store.getState().filters.branches).toEqual(['north'])

    fireEvent.click(screen.getByText('Северный'))
    expect(store.getState().filters.branches).toHaveLength(7)
  })
})
