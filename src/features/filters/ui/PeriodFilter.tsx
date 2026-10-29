import { DATA_END, DATA_START } from '@/shared/api/mocks'
import { Select, type SelectOption } from '@/shared/ui'
import { useFilters } from '../model/useFilters'
import {
  MONTH_OPTIONS,
  QUARTER_OPTIONS,
  customPeriod,
  formatPeriodLabel,
  periodFromMonthValue,
  periodFromQuarterValue,
  periodToOptionValue,
  ytdPeriod,
  type PeriodKind,
} from '../model/period'

const KIND_OPTIONS: SelectOption<PeriodKind>[] = [
  { value: 'ytd', label: 'С начала года' },
  { value: 'quarter', label: 'Квартал' },
  { value: 'month', label: 'Месяц' },
  { value: 'custom', label: 'Произвольный' },
]

const dateInputClass =
  'h-8 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500'

export const PeriodFilter = () => {
  const { filters, setPeriod } = useFilters()
  const { period } = filters

  const changeKind = (kind: PeriodKind) => {
    if (kind === 'ytd') setPeriod(ytdPeriod())
    else if (kind === 'month') setPeriod(periodFromMonthValue(MONTH_OPTIONS[0]?.value ?? ''))
    else if (kind === 'quarter') setPeriod(periodFromQuarterValue(QUARTER_OPTIONS[0]?.value ?? ''))
    else setPeriod(customPeriod(period.from, period.to))
  }

  return (
    <div className="flex items-center gap-2">
      <Select label="Период" value={period.kind} options={KIND_OPTIONS} onChange={changeKind} valueText={formatPeriodLabel(period)} />
      {period.kind === 'month' && (
        <Select
          label="Месяц"
          value={periodToOptionValue(period)}
          options={MONTH_OPTIONS}
          onChange={(value) => setPeriod(periodFromMonthValue(value))}
        />
      )}
      {period.kind === 'quarter' && (
        <Select
          label="Квартал"
          value={periodToOptionValue(period)}
          options={QUARTER_OPTIONS}
          onChange={(value) => setPeriod(periodFromQuarterValue(value))}
        />
      )}
      {period.kind === 'custom' && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            aria-label="Начало периода"
            className={dateInputClass}
            min={DATA_START}
            max={DATA_END}
            value={period.from}
            onChange={(event) => event.target.value && setPeriod(customPeriod(event.target.value, period.to))}
          />
          <span className="text-slate-400">–</span>
          <input
            type="date"
            aria-label="Конец периода"
            className={dateInputClass}
            min={DATA_START}
            max={DATA_END}
            value={period.to}
            onChange={(event) => event.target.value && setPeriod(customPeriod(period.from, event.target.value))}
          />
        </div>
      )}
    </div>
  )
}
