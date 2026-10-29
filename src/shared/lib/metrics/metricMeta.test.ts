import { describe, expect, it } from 'vitest'
import { computeDelta, getDeltaTone, isGoodDelta, METRIC_META, type MetricKey } from './metricMeta'

describe('isGoodDelta', () => {
  it('treats growth as good for "higher is better" metrics', () => {
    expect(isGoodDelta('revenue', 12.7)).toBe(true)
    expect(isGoodDelta('capacityLoad', 4)).toBe(true)
    expect(isGoodDelta('revenue', -3)).toBe(false)
  })

  it('treats a decrease as good for cancellations, CPL and CAC', () => {
    expect(isGoodDelta('cancellationRate', -1.1)).toBe(true)
    expect(isGoodDelta('cpl', -9.2)).toBe(true)
    expect(isGoodDelta('cac', -6.8)).toBe(true)
    expect(isGoodDelta('cpl', 2)).toBe(false)
  })

  it('has a neutral tone for zero change', () => {
    expect(getDeltaTone('revenue', 0)).toBe('neutral')
    expect(isGoodDelta('revenue', 0)).toBe(false)
  })

  it('defines the direction for every metric', () => {
    const lowerIsBetter = (Object.keys(METRIC_META) as MetricKey[]).filter((key) => METRIC_META[key].better === 'lower')
    expect(lowerIsBetter.sort()).toEqual(['cac', 'cancellationRate', 'cpl'])
  })
})

describe('computeDelta', () => {
  it('is relative % for money and counts, points for ratios', () => {
    expect(computeDelta('revenue', 112, 100)).toBeCloseTo(12)
    expect(computeDelta('capacityLoad', 81, 77)).toBe(4)
  })

  it('is null when a side is missing or the base is zero', () => {
    expect(computeDelta('revenue', null, 100)).toBeNull()
    expect(computeDelta('revenue', 10, 0)).toBeNull()
  })
})
