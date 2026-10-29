import { formatNumber } from '@/shared/lib/format'
import { AnimatedNumber, Delta, Sparkline, Tooltip } from '@/shared/ui'
import { useMarketingKpi, type MarketingKpiKey, type MarketingKpiView } from '../model/useMarketingKpi'

const formatValue = (key: MarketingKpiKey, value: number): { text: string; unit: string | null } => {
  switch (key) {
    case 'leads':
      return { text: formatNumber(value), unit: null }
    case 'bookingConversion':
      return { text: formatNumber(value, 1), unit: '%' }
    case 'cpl':
    case 'cac':
      return { text: formatNumber(Math.round(value)), unit: '₽' }
    case 'romi':
      return { text: formatNumber(Math.round(value)), unit: '%' }
  }
}

const formatKpi = (key: MarketingKpiKey, value: number): string => {
  const { text, unit } = formatValue(key, value)
  return unit ? `${text} ${unit}` : text
}

const KpiCard = ({ kpi, tooltipAlign }: { kpi: MarketingKpiView; tooltipAlign: 'start' | 'end' }) => {
  const formatted = kpi.value === null ? null : formatValue(kpi.key, kpi.value)
  return (
    <article data-testid={`kpi-${kpi.key}`} className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <div className="min-w-0 shrink-0">
        <h3 className="text-xs text-slate-500">
          <Tooltip content={kpi.hint} side="bottom" align={tooltipAlign} wrap>
            <span tabIndex={0} className="cursor-help rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">{kpi.title}</span>
          </Tooltip>
        </h3>
        <p className="mt-0.5 flex items-baseline gap-1 whitespace-nowrap">
          <span data-testid="kpi-value" className="text-[28px] font-bold leading-9 text-slate-900 tabular-nums">
            {kpi.value === null ? '—' : <AnimatedNumber value={kpi.value} format={(value) => formatValue(kpi.key, value).text} />}
          </span>
          {formatted?.unit && <span className="text-[13px] font-medium text-slate-500">{formatted.unit}</span>}
        </p>
        <p className="mt-0.5 flex items-baseline gap-2 whitespace-nowrap text-xs">
          {kpi.delta === null ? <span className="text-slate-400">нет данных для сравнения</span> : <Delta metric={kpi.key} value={kpi.delta} suffix={kpi.baseLabel} />}
        </p>
      </div>
      <div className="w-[42%] min-w-0 max-w-[150px]">
        <Sparkline data={kpi.spark} tone={kpi.sparkTone} height={44} formatValue={(value) => formatKpi(kpi.key, value)} />
      </div>
    </article>
  )
}

/** Row of five marketing KPI cards: leads, booking conversion, CPL, CAC, ROMI. */
export const MarketingKpi = () => {
  const kpis = useMarketingKpi()
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi, index) => (
        <KpiCard key={kpi.key} kpi={kpi} tooltipAlign={index < 3 ? 'start' : 'end'} />
      ))}
    </div>
  )
}
