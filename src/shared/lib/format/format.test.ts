import { describe, expect, it } from 'vitest'
import {
  formatDeltaPercent,
  formatMillions,
  formatMillionsRub,
  formatNumber,
  formatPercent,
  formatPercentPoints,
  formatRub,
} from './index'

const nb = (text: string) => text.replaceAll(' ', ' ')

describe('format', () => {
  it('groups thousands with a non-breaking space', () => {
    expect(formatNumber(181240)).toBe(nb('181 240'))
    expect(formatNumber(999)).toBe('999')
    expect(formatNumber(1284600)).toBe(nb('1 284 600'))
  })

  it('formats rubles', () => {
    expect(formatRub(2278.4)).toBe(nb('2 278 ₽'))
  })

  it('formats millions with one decimal and a decimal comma', () => {
    expect(formatMillions(412_800_000)).toBe('412,8')
    expect(formatMillionsRub(31_460_000)).toBe(nb('31,5 млн ₽'))
  })

  it('formats percents and deltas with signs', () => {
    expect(formatPercent(38.24)).toBe('38,2%')
    expect(formatDeltaPercent(12.74)).toBe('+12,7%')
    expect(formatDeltaPercent(-9.2)).toBe('−9,2%')
    expect(formatPercentPoints(1.1)).toBe(nb('+1,1 п.п.'))
    expect(formatPercentPoints(-0.04)).toBe(nb('0,0 п.п.'))
  })
})
