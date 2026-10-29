import { describe, expect, it } from 'vitest'
import { getDataset } from '@/shared/api/mocks'
import { capacityHeatmap } from './breakdowns'
import { capacityLoad } from './sales'

describe('capacityHeatmap', () => {
  const dataset = getDataset()
  const range = { from: '2026-09-03', to: '2026-10-28' }

  it('has 7 weekday rows and one column per slot hour', () => {
    const rows = capacityHeatmap(dataset, range)
    expect(rows).toHaveLength(7)
    expect(rows.every((row) => row.length === 13)).toBe(true)
    expect(rows[0]?.[0]).toMatchObject({ weekday: 0, hour: 8 })
  })

  it('loads stay within 0–100% and a single branch differs from the network', () => {
    const all = capacityHeatmap(dataset, range).flat()
    expect(all.every((cell) => cell.load !== null && cell.load >= 0 && cell.load <= 100)).toBe(true)
    const park = capacityHeatmap(dataset, { ...range, branchIds: ['park'] }).flat()
    expect(park.map((cell) => cell.load)).not.toEqual(all.map((cell) => cell.load))
  })

  it('average over cells is close to the overall capacity load', () => {
    const cells = capacityHeatmap(dataset, range).flat()
    const mean = cells.reduce((sum, cell) => sum + (cell.load ?? 0), 0) / cells.length
    expect(Math.abs(mean - (capacityLoad(dataset, range) ?? 0))).toBeLessThan(6)
  })
})
