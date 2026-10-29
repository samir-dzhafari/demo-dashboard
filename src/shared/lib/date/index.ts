import {
  addDays as fnsAddDays,
  addMonths as fnsAddMonths,
  differenceInCalendarDays,
  endOfMonth as fnsEndOfMonth,
  format,
  getISODay,
  parseISO,
  startOfISOWeek,
  startOfMonth as fnsStartOfMonth,
  subYears,
} from 'date-fns'

/** All dates in the app are plain `YYYY-MM-DD` strings; these helpers keep time zones out of the picture. */
export type IsoDate = string
export type MonthKey = string

const FORMAT = 'yyyy-MM-dd'

export const toIsoDate = (date: Date): IsoDate => format(date, FORMAT)
export const parseIsoDate = (iso: IsoDate): Date => parseISO(iso)

export const addDays = (iso: IsoDate, amount: number): IsoDate => toIsoDate(fnsAddDays(parseISO(iso), amount))
export const addMonths = (iso: IsoDate, amount: number): IsoDate => toIsoDate(fnsAddMonths(parseISO(iso), amount))
export const shiftYear = (iso: IsoDate, years: number): IsoDate => toIsoDate(subYears(parseISO(iso), -years))
export const diffDays = (later: IsoDate, earlier: IsoDate): number =>
  differenceInCalendarDays(parseISO(later), parseISO(earlier))

export const startOfMonth = (iso: IsoDate): IsoDate => toIsoDate(fnsStartOfMonth(parseISO(iso)))
export const endOfMonth = (iso: IsoDate): IsoDate => toIsoDate(fnsEndOfMonth(parseISO(iso)))
export const startOfWeek = (iso: IsoDate): IsoDate => toIsoDate(startOfISOWeek(parseISO(iso)))

/** Monday = 0 … Sunday = 6. */
export const weekdayIndex = (iso: IsoDate): number => getISODay(parseISO(iso)) - 1

export const monthKey = (isoOrDateTime: string): MonthKey => isoOrDateTime.slice(0, 7)
export const daysInMonth = (key: MonthKey): number => diffDays(endOfMonth(`${key}-01`), `${key}-01`) + 1

export interface DateRange {
  from: IsoDate
  to: IsoDate
}

export const eachDay = ({ from, to }: DateRange): IsoDate[] => {
  const days: IsoDate[] = []
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day)
  return days
}

/** Calendar months touched by the range, each clipped to the range. */
export const splitByMonth = ({ from, to }: DateRange): Array<DateRange & { month: MonthKey }> => {
  const parts: Array<DateRange & { month: MonthKey }> = []
  for (let cursor = startOfMonth(from); cursor <= to; cursor = addMonths(cursor, 1)) {
    const monthEnd = endOfMonth(cursor)
    parts.push({
      month: monthKey(cursor),
      from: cursor < from ? from : cursor,
      to: monthEnd > to ? to : monthEnd,
    })
  }
  return parts
}

/** Same period one year earlier — the default comparison base. */
export const previousYearRange = ({ from, to }: DateRange): DateRange => ({
  from: shiftYear(from, -1),
  to: shiftYear(to, -1),
})
