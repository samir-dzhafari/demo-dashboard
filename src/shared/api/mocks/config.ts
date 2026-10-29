export const DEFAULT_SEED = 20261029
/** January of the previous year … "yesterday" of the demo. */
export const DATA_START = '2025-01-01'
export const DATA_END = '2026-10-28'
/** A lead is created up to 6 days before its visit and visits after `DATA_END` are not generated: leads of the last days are censored. */
export const LEAD_LAG_DAYS = 6
export const UPDATED_AT = '2026-10-28T23:00'

export const FIRST_HOUR = 8
export const LAST_HOUR = 20

/** Month index (0 = Jan 2025) around which all linear year-over-year trends are centred: mid-2026 YTD. */
export const TREND_CENTER = 16.5

export interface BranchConfig {
  id: string
  name: string
  resources: number
  /** Target average load of available slots for Jan–Oct 2026. */
  baseLoad: number
  /** Price level relative to the network. */
  priceIndex: number
  /** Share of canceled + no-show records for Jan–Oct 2026. */
  cancelRate: number
  /** Planned over/under-performance of actual revenue against plan in 2026 (+5% = plan is 5% below fact). */
  planDeviation: number
}

export const BRANCHES: readonly BranchConfig[] = [
  { id: 'central', name: 'Центральный', resources: 11, baseLoad: 0.89, priceIndex: 1.115, cancelRate: 0.051, planDeviation: 0.05 },
  { id: 'north', name: 'Северный', resources: 10, baseLoad: 0.84, priceIndex: 1.014, cancelRate: 0.058, planDeviation: -0.03 },
  { id: 'south', name: 'Южный', resources: 9, baseLoad: 0.86, priceIndex: 0.992, cancelRate: 0.06, planDeviation: 0.058 },
  { id: 'west', name: 'Западный', resources: 10, baseLoad: 0.74, priceIndex: 0.961, cancelRate: 0.079, planDeviation: -0.046 },
  { id: 'east', name: 'Восточный', resources: 8, baseLoad: 0.79, priceIndex: 0.931, cancelRate: 0.066, planDeviation: 0.057 },
  { id: 'river', name: 'Речной', resources: 8, baseLoad: 0.68, priceIndex: 0.9, cancelRate: 0.084, planDeviation: -0.085 },
  { id: 'park', name: 'Парковый', resources: 6, baseLoad: 0.77, priceIndex: 0.917, cancelRate: 0.069, planDeviation: 0.064 },
]

export interface ServiceConfig {
  id: string
  name: string
  price: number
}

export interface DirectionConfig {
  id: string
  name: string
  /** Share of visits in Jan 2025 and Oct 2026; packages and corporate grow over time. */
  visitShareStart: number
  visitShareEnd: number
  /** Multiplier of the share for the first visit of a client who came from a lead. */
  firstVisitBoost: number
  services: readonly ServiceConfig[]
}

export const DIRECTIONS: readonly DirectionConfig[] = [
  {
    id: 'basic',
    name: 'Базовые услуги',
    visitShareStart: 0.6,
    visitShareEnd: 0.58,
    firstVisitBoost: 0.8,
    services: [
      { id: 'basic-consult', name: 'Консультация', price: 1150 },
      { id: 'basic-standard', name: 'Стандартная процедура', price: 1500 },
      { id: 'basic-diagnostic', name: 'Диагностика', price: 1800 },
    ],
  },
  {
    id: 'extended',
    name: 'Расширенные',
    visitShareStart: 0.2,
    visitShareEnd: 0.2,
    firstVisitBoost: 1,
    services: [
      { id: 'ext-program', name: 'Расширенная программа', price: 2500 },
      { id: 'ext-plus', name: 'Программа Плюс', price: 2850 },
      { id: 'ext-diagnostic', name: 'Расширенная диагностика', price: 3100 },
    ],
  },
  {
    id: 'packages',
    name: 'Комплексные пакеты',
    visitShareStart: 0.055,
    visitShareEnd: 0.068,
    firstVisitBoost: 2,
    services: [
      { id: 'pkg-start', name: 'Пакет «Старт»', price: 4500 },
      { id: 'pkg-optimum', name: 'Пакет «Оптимум»', price: 5700 },
      { id: 'pkg-max', name: 'Пакет «Максимум»', price: 7400 },
    ],
  },
  {
    id: 'corporate',
    name: 'Корп. договоры',
    visitShareStart: 0.05,
    visitShareEnd: 0.062,
    firstVisitBoost: 0.6,
    services: [
      { id: 'corp-pass', name: 'Корпоративный абонемент', price: 5500 },
      { id: 'corp-visit', name: 'Корпоративный выезд', price: 6800 },
      { id: 'corp-program', name: 'Корпоративная программа', price: 8000 },
    ],
  },
  {
    id: 'other',
    name: 'Прочее',
    visitShareStart: 0.11,
    visitShareEnd: 0.105,
    firstVisitBoost: 0.9,
    services: [
      { id: 'other-extra', name: 'Дополнительная услуга', price: 1350 },
      { id: 'other-certificate', name: 'Подарочный сертификат', price: 1900 },
      { id: 'other-goods', name: 'Сопутствующие товары', price: 1750 },
    ],
  },
]

export interface ChannelConfig {
  id: string
  name: string
  /** Approximate share of all leads (reference screenshot). */
  leadShare: number
  /** Share of leads that end up with a booking. */
  conversion: number
  /** Average cost per lead for Jan–Oct 2026, ₽. */
  cpl: number
  /** Leads per site/maps visit. */
  visitRate: number
  campaigns: readonly [string, string]
}

export const CHANNELS: readonly ChannelConfig[] = [
  { id: 'ads', name: 'Контекстная реклама', leadShare: 0.342, conversion: 0.35, cpl: 560, visitRate: 0.047, campaigns: ['Поиск — бренд', 'Поиск — категории'] },
  { id: 'seo', name: 'SEO и контент', leadShare: 0.226, conversion: 0.399, cpl: 280, visitRate: 0.0575, campaigns: ['Блог и статьи', 'Посадочные страницы'] },
  { id: 'maps', name: 'Карты и агрегаторы', leadShare: 0.206, conversion: 0.418, cpl: 433, visitRate: 0.063, campaigns: ['Карты — карточки', 'Агрегаторы — отзывы'] },
  { id: 'social', name: 'Соцсети', leadShare: 0.111, conversion: 0.282, cpl: 638, visitRate: 0.042, campaigns: ['Таргет', 'Блогеры'] },
  { id: 'partners', name: 'Партнёрские программы', leadShare: 0.077, conversion: 0.457, cpl: 643, visitRate: 0.0525, campaigns: ['Партнёры — подписка', 'Партнёры — купоны'] },
  { id: 'email', name: 'Email и CRM-рассылки', leadShare: 0.039, conversion: 0.505, cpl: 560, visitRate: 0.084, campaigns: ['Триггерные цепочки', 'Разовые рассылки'] },
]

/** Calendar-month factors (index 0 = January). Autumn peak, summer dip. */
export const LOAD_SEASON = [0.93, 0.95, 0.99, 1.0, 0.98, 0.95, 0.92, 0.94, 1.05, 1.07, 1.03, 0.98] as const
export const AVAILABILITY_SEASON = [0.9, 0.91, 0.93, 0.94, 0.94, 0.92, 0.88, 0.88, 0.96, 0.98, 0.97, 0.92] as const
/** Mean of LOAD_SEASON over Jan–Oct, the window `BranchConfig.baseLoad` refers to. */
export const LOAD_SEASON_MEAN = 0.978

export const WEEKDAY_WEIGHTS = [1, 1, 1, 1, 1, 0.88, 0.65] as const
/** Relative demand by start hour 8..20. */
export const HOUR_WEIGHTS = [0.78, 0.92, 1.05, 1.1, 1.1, 1.0, 1.05, 1.1, 1.1, 1.1, 1.0, 0.92, 0.8] as const
export const WEEKEND_EVENING_FACTOR = 0.7

export const GROWTH = {
  /** Per month, relative; ×12 gives the year-over-year change. */
  loadPerMonth: 0.0042,
  availabilityPerMonth: 0.0017,
  pricePerMonth: 0.0006,
  cancelPerMonth: -0.0135,
  conversionPerMonth: 0.0078,
  cplPerMonth: -0.0075,
  leadShareOfNewClientsPerMonth: 0.0157,
} as const

/** Probability that a completed visit belongs to a client who has not visited before. */
export const NEW_CLIENT_PROBABILITY = 0.36
/** Probability that a new client came through a lead (mean for Jan–Oct 2026). */
export const LEAD_SHARE_OF_NEW_CLIENTS = 0.381
/** Share of lead-linked bookings that did not take place. */
export const LEAD_BOOKING_FAILURE = 0.08
export const DUPLICATE_LEAD_RATE = 0.04
export const REFUND_PROBABILITY = 0.015
export const NO_SHOW_SHARE_OF_LOST = 0.4
export const FIRST_VISIT_PRICE_UPLIFT = 2.95
export const INITIAL_CLIENTS_PER_RESOURCE = 4000
/** Returning clients are drawn skewed towards recently acquired ones (1 = uniform; higher = stronger skew). */
export const RETURNING_CLIENT_RECENCY_SKEW = 2.2

/** Share of bookings made online: [monthIndex, share] anchors, linearly interpolated. */
export const ONLINE_SHARE_ANCHORS: ReadonlyArray<readonly [number, number]> = [
  [0, 0.2],
  [12, 0.28],
  [16, 0.32],
  [21, 0.47],
]
export const MESSENGER_SHARE = 0.15

/** Days between booking creation and the slot: [days, weight]. */
export const BOOKING_LEAD_TIME: ReadonlyArray<readonly [number, number]> = [
  [0, 0.3], [1, 0.2], [2, 0.15], [3, 0.1], [4, 0.08], [5, 0.06], [6, 0.05], [7, 0.03], [10, 0.02], [14, 0.01],
]

export const PLAN_GROWTH_FOR_FUTURE_MONTHS = 1.115

/** Fine-tuning knobs that bring the aggregate numbers close to the reference screenshots. */
export const LOAD_CALIBRATION = 1.05
export const CANCEL_CALIBRATION = 0.86
export const PRICE_SCALE = 0.772
