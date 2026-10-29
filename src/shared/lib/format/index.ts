const NBSP = ' '
const MINUS = '−'

const groupThousands = (integerPart: string): string => integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)

/** Fixed-decimals number with a non-breaking space as thousands separator and a decimal comma. */
export const formatNumber = (value: number, fractionDigits = 0): string => {
  const fixed = Math.abs(value).toFixed(fractionDigits)
  const [integerPart = '0', fractionPart] = fixed.split('.')
  const body = fractionPart ? `${groupThousands(integerPart)},${fractionPart}` : groupThousands(integerPart)
  const isNegative = value < 0 && Number(fixed) !== 0
  return isNegative ? `${MINUS}${body}` : body
}

export const formatRub = (value: number): string => `${formatNumber(Math.round(value))}${NBSP}₽`

/** Millions of rubles without a unit: 412 800 000 → "412,8". */
export const formatMillions = (rub: number): string => formatNumber(rub / 1_000_000, 1)

export const formatMillionsRub = (rub: number): string => `${formatMillions(rub)}${NBSP}млн${NBSP}₽`

export const formatPercent = (value: number, fractionDigits = 1): string => `${formatNumber(value, fractionDigits)}%`

const withSign = (value: number, fractionDigits: number, suffix: string): string => {
  const body = formatNumber(Math.abs(value), fractionDigits)
  const isZero = Number(Math.abs(value).toFixed(fractionDigits)) === 0
  const sign = isZero ? '' : value > 0 ? '+' : MINUS
  return `${sign}${body}${suffix}`
}

/** Relative change, e.g. "+12,7%". */
export const formatDeltaPercent = (value: number, fractionDigits = 1): string => withSign(value, fractionDigits, '%')

/** Change of a percentage metric in percentage points, e.g. "+1,1 п.п.". */
export const formatPercentPoints = (value: number, fractionDigits = 1): string =>
  withSign(value, fractionDigits, `${NBSP}п.п.`)

const MONTH_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
const MONTH_PREPOSITIONAL = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре']
const MONTH_GENITIVE_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const monthIndex = (key: string): number => Number(key.slice(5, 7)) - 1

/** `2026-10` → "Окт". */
export const monthShort = (key: string): string => MONTH_SHORT[monthIndex(key)] ?? key
/** `2026-10` → "октябре" (for "в октябре"). */
export const monthPrepositional = (key: string): string => MONTH_PREPOSITIONAL[monthIndex(key)] ?? key
/** `2026-10` → "окт" (lowercase, for subtitles like "май – окт"). */
export const monthLowerShort = (key: string): string => MONTH_GENITIVE_SHORT[monthIndex(key)] ?? key
/** `2026-10-12` → "12.10". */
export const formatDayMonth = (iso: string): string => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`
