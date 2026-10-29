import { DATA_END, DATA_START } from '@/shared/api/mocks'
import { endOfMonth, type IsoDate } from '@/shared/lib/date'

export type PeriodKind = 'month' | 'quarter' | 'ytd' | 'custom'

export interface PeriodValue {
  kind: PeriodKind
  from: IsoDate
  to: IsoDate
}

const pad = (value: number): string => String(value).padStart(2, '0')
const clampToData = (iso: IsoDate): IsoDate => (iso > DATA_END ? DATA_END : iso)

/** Year-to-date of the spec: from 1 January until yesterday. */
export const ytdPeriod = (until: IsoDate = DATA_END): PeriodValue => ({
  kind: 'ytd',
  from: `${until.slice(0, 4)}-01-01`,
  to: until,
})

/** `month` is 1-based. The end is clipped to the last day with data. */
export const monthPeriod = (year: number, month: number): PeriodValue => {
  const from = `${year}-${pad(month)}-01`
  return { kind: 'month', from, to: clampToData(endOfMonth(from)) }
}

/** `quarter` is 1…4. */
export const quarterPeriod = (year: number, quarter: number): PeriodValue => {
  const firstMonth = (quarter - 1) * 3 + 1
  return {
    kind: 'quarter',
    from: `${year}-${pad(firstMonth)}-01`,
    to: clampToData(endOfMonth(`${year}-${pad(firstMonth + 2)}-01`)),
  }
}

export const customPeriod = (from: IsoDate, to: IsoDate): PeriodValue =>
  from <= to ? { kind: 'custom', from, to } : { kind: 'custom', from: to, to: from }

const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const MONTH_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

const firstYear = Number(DATA_START.slice(0, 4))
const lastYear = Number(DATA_END.slice(0, 4))
const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index)

export interface PeriodOption {
  value: string
  label: string
}

/** Months and quarters that have data, newest first (`YYYY-MM` / `YYYY-Qn`). */
export const MONTH_OPTIONS: readonly PeriodOption[] = years
  .flatMap((year) => Array.from({ length: 12 }, (_, index) => ({ year, month: index + 1 })))
  .filter(({ year, month }) => `${year}-${pad(month)}-01` <= DATA_END)
  .map(({ year, month }) => ({ value: `${year}-${pad(month)}`, label: `${MONTH_NAMES[month - 1]} ${year}` }))
  .reverse()

export const QUARTER_OPTIONS: readonly PeriodOption[] = years
  .flatMap((year) => [1, 2, 3, 4].map((quarter) => ({ year, quarter })))
  .filter(({ year, quarter }) => `${year}-${pad((quarter - 1) * 3 + 1)}-01` <= DATA_END)
  .map(({ year, quarter }) => ({ value: `${year}-Q${quarter}`, label: `${quarter} кв. ${year}` }))
  .reverse()

export const periodFromMonthValue = (value: string): PeriodValue => {
  const [year, month] = value.split('-').map(Number)
  return monthPeriod(year ?? lastYear, month ?? 1)
}

export const periodFromQuarterValue = (value: string): PeriodValue => {
  const [year, quarter] = value.split('-Q').map(Number)
  return quarterPeriod(year ?? lastYear, quarter ?? 1)
}

/** Value of the secondary select (month or quarter) matching the period. */
export const periodToOptionValue = (period: PeriodValue): string =>
  period.kind === 'quarter'
    ? `${period.from.slice(0, 4)}-Q${Math.floor((Number(period.from.slice(5, 7)) - 1) / 3) + 1}`
    : period.from.slice(0, 7)

const toRuDate = (iso: IsoDate): string => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`

/** Topbar label: "Янв – Окт 2026", "Октябрь 2026", "3 кв. 2026", "01.09.2026 – 15.10.2026". */
export const formatPeriodLabel = (period: PeriodValue): string => {
  const fromMonth = Number(period.from.slice(5, 7))
  const toMonth = Number(period.to.slice(5, 7))
  switch (period.kind) {
    case 'ytd':
      return `${MONTH_SHORT[fromMonth - 1]} – ${MONTH_SHORT[toMonth - 1]} ${period.to.slice(0, 4)}`
    case 'month':
      return `${MONTH_NAMES[fromMonth - 1]} ${period.from.slice(0, 4)}`
    case 'quarter':
      return `${Math.floor((fromMonth - 1) / 3) + 1} кв. ${period.from.slice(0, 4)}`
    case 'custom':
      return `${toRuDate(period.from)} – ${toRuDate(period.to)}`
  }
}
